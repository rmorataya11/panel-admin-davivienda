import { randomBytes } from "node:crypto";

import type { PoolClient } from "pg";

import {
  isSandboxRequest,
  normalizeAccessRequestType,
  type AdminContractingRequest,
  type ContractingStatus,
} from "@/lib/admin/types";
import { getPool, query } from "@/lib/db/client";

type ContractingRequestRow = {
  id: string;
  developer_id: string;
  developer_name: string;
  developer_email: string;
  razon_social: string;
  nit: string;
  industria: string;
  caso_uso: string;
  volumen_estimado: string;
  ambiente_destino: string;
  contacto_tecnico_nombre: string;
  contacto_tecnico_email: string;
  contacto_tecnico_telefono: string | null;
  api_product: string | null;
  api_name: string | null;
  app_id: string | null;
  app_name: string | null;
  status: string;
  created_at: Date | string;
};

const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

const selectSql = `
  SELECT
    cr.id,
    cr.developer_id,
    COALESCE(developers.full_name, '') AS developer_name,
    COALESCE(developers.email, '') AS developer_email,
    cr.razon_social,
    cr.nit,
    cr.industria,
    cr.caso_uso,
    cr.volumen_estimado,
    cr.ambiente_destino,
    cr.contacto_tecnico_nombre,
    cr.contacto_tecnico_email,
    cr.contacto_tecnico_telefono,
    cr.api_product,
    COALESCE(catalog_apis.content_es->>'title', cr.api_product) AS api_name,
    cr.app_id,
    apps.name AS app_name,
    cr.status,
    cr.created_at
  FROM contracting_requests cr
  LEFT JOIN developers ON developers.id = cr.developer_id
  LEFT JOIN apps ON apps.id = cr.app_id
  LEFT JOIN catalog_apis ON catalog_apis.slug = cr.api_product
`;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function randomToken(length: number) {
  const bytes = randomBytes(length);
  let token = "";

  for (let index = 0; index < length; index += 1) {
    token += TOKEN_ALPHABET[bytes[index] % TOKEN_ALPHABET.length];
  }

  return token;
}

function mapContractingRequest(row: ContractingRequestRow): AdminContractingRequest {
  return {
    id: row.id,
    developerId: row.developer_id,
    developerName: row.developer_name,
    developerEmail: row.developer_email,
    razonSocial: row.razon_social,
    nit: row.nit,
    industria: row.industria,
    casoUso: row.caso_uso,
    volumenEstimado: row.volumen_estimado,
    ambienteDestino: row.ambiente_destino,
    requestType: normalizeAccessRequestType(row.ambiente_destino),
    contactoTecnicoNombre: row.contacto_tecnico_nombre,
    contactoTecnicoEmail: row.contacto_tecnico_email,
    contactoTecnicoTelefono: row.contacto_tecnico_telefono,
    apiProduct: row.api_product,
    apiName: row.api_name,
    appId: row.app_id,
    appName: row.app_name,
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

export async function listContractingRequests(): Promise<AdminContractingRequest[]> {
  const result = await query<ContractingRequestRow>(
    `${selectSql}
     ORDER BY cr.created_at DESC`,
  );

  return result.rows.map(mapContractingRequest);
}

export async function listContractingRequestsByDeveloper(
  developerId: string,
): Promise<AdminContractingRequest[]> {
  const result = await query<ContractingRequestRow>(
    `${selectSql}
     WHERE cr.developer_id = $1
     ORDER BY cr.created_at DESC`,
    [developerId],
  );

  return result.rows.map(mapContractingRequest);
}

async function getContractingRequest(id: string): Promise<AdminContractingRequest | null> {
  const result = await query<ContractingRequestRow>(`${selectSql} WHERE cr.id = $1`, [id]);
  const row = result.rows[0];
  return row ? mapContractingRequest(row) : null;
}

async function resolveApiTitle(client: PoolClient, slug: string): Promise<string> {
  const result = await client.query<{ title: string | null }>(
    `SELECT content_es->>'title' AS title
     FROM catalog_apis
     WHERE slug = $1`,
    [slug],
  );

  return result.rows[0]?.title?.trim() || slug;
}

async function provisionApp(
  client: PoolClient,
  input: {
    developerId: string;
    apiProduct: string;
    description: string | null;
    environment: "sandbox" | "production";
  },
): Promise<string> {
  const title = await resolveApiTitle(client, input.apiProduct);
  const isSandbox = input.environment === "sandbox";
  const name = `${title} · ${isSandbox ? "Sandbox" : "Producción"}`;
  const consumerKey = `${isSandbox ? "dvn_pk_sandbox_" : "dvn_pk_prod_"}${randomToken(20)}`;
  const dailyQuota = isSandbox ? 2 : 100;
  const keyDays = isSandbox ? 30 : 365;

  const appResult = await client.query<{ id: string }>(
    `INSERT INTO apps (
       developer_id,
       name,
       description,
       api_product,
       environment,
       status,
       daily_quota
     )
     VALUES ($1, $2, $3, $4, $5, 'active', $6)
     RETURNING id`,
    [input.developerId, name, input.description, input.apiProduct, input.environment, dailyQuota],
  );

  const appId = appResult.rows[0]?.id;
  if (!appId) {
    throw new Error(`No se pudo crear la app de ${input.environment}.`);
  }

  await client.query(
    `INSERT INTO api_keys (app_id, consumer_key, status, expires_at)
     VALUES ($1, $2, 'approved', now() + make_interval(days => $3))`,
    [appId, consumerKey, keyDays],
  );

  return appId;
}

export async function updateContractingRequestStatus(
  id: string,
  status: ContractingStatus,
): Promise<AdminContractingRequest | null> {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query<{
      app_id: string | null;
      developer_id: string;
      api_product: string | null;
      caso_uso: string;
      ambiente_destino: string;
      status: string;
    }>(
      `SELECT app_id, developer_id, api_product, caso_uso, ambiente_destino, status
       FROM contracting_requests
       WHERE id = $1
       FOR UPDATE`,
      [id],
    );

    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    const updated = await client.query(
      `UPDATE contracting_requests
       SET status = $2, updated_at = now()
       WHERE id = $1`,
      [id, status],
    );

    if ((updated.rowCount ?? 0) !== 1) {
      await client.query("ROLLBACK");
      return null;
    }

    if (status === "approved") {
      const sandbox = isSandboxRequest(current.ambiente_destino);

      if (sandbox) {
        await client.query(
          `UPDATE developers
           SET sandbox_access_granted_at = COALESCE(sandbox_access_granted_at, now()),
               updated_at = now()
           WHERE id = $1`,
          [current.developer_id],
        );

        if (current.app_id) {
          await client.query(
            `UPDATE apps
             SET status = 'active',
                 environment = CASE
                   WHEN environment = 'production' THEN environment
                   ELSE 'sandbox'
                 END
             WHERE id = $1`,
            [current.app_id],
          );
        } else {
          if (!current.api_product) {
            throw new Error("La solicitud no indica una API para crear la app sandbox.");
          }

          const appId = await provisionApp(client, {
            developerId: current.developer_id,
            apiProduct: current.api_product,
            description: current.caso_uso?.trim() || null,
            environment: "sandbox",
          });

          await client.query(
            `UPDATE contracting_requests
             SET app_id = $2
             WHERE id = $1`,
            [id, appId],
          );
        }
      } else if (current.app_id) {
        const appUpdate = await client.query(
          `UPDATE apps
           SET environment = 'production', status = 'active'
           WHERE id = $1`,
          [current.app_id],
        );

        if ((appUpdate.rowCount ?? 0) !== 1) {
          throw new Error("No se encontró la app vinculada.");
        }
      } else {
        if (!current.api_product) {
          throw new Error("La solicitud no indica una API para crear la app.");
        }

        const appId = await provisionApp(client, {
          developerId: current.developer_id,
          apiProduct: current.api_product,
          description: current.caso_uso?.trim() || null,
          environment: "production",
        });

        await client.query(
          `UPDATE contracting_requests
           SET app_id = $2
           WHERE id = $1`,
          [id, appId],
        );
      }
    }

    // Rechazar solo cambia el estado: no se revoca acceso ni apps ya existentes.
    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir la transacción de solicitud.",
        rollbackError instanceof Error ? rollbackError.message : rollbackError,
      );
    }

    throw error;
  } finally {
    client.release();
  }

  return getContractingRequest(id);
}
