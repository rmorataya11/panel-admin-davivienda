import { randomBytes } from "node:crypto";

import type { PoolClient } from "pg";

import {
  type AdminContractingRequest,
  type ContractingStatus,
} from "@/lib/admin/types";
import { getPool, query } from "@/lib/db/client";

type ContractingRequestRow = {
  id: string;
  razon_social: string;
  nit: string;
  industria: string;
  caso_uso: string;
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
    cr.razon_social,
    cr.nit,
    cr.industria,
    cr.caso_uso,
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
    razonSocial: row.razon_social,
    nit: row.nit,
    industria: row.industria,
    casoUso: row.caso_uso,
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

async function provisionProductionApp(
  client: PoolClient,
  input: {
    developerId: string;
    apiProduct: string;
    description: string | null;
  },
): Promise<string> {
  const title = await resolveApiTitle(client, input.apiProduct);
  const name = `${title} · Producción`;
  const consumerKey = `dvn_pk_prod_${randomToken(20)}`;

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
     VALUES ($1, $2, $3, $4, 'production', 'active', 100)
     RETURNING id`,
    [input.developerId, name, input.description, input.apiProduct],
  );

  const appId = appResult.rows[0]?.id;
  if (!appId) {
    throw new Error("No se pudo crear la app de producción.");
  }

  await client.query(
    `INSERT INTO api_keys (app_id, consumer_key, status, expires_at)
     VALUES ($1, $2, 'approved', now() + interval '365 days')`,
    [appId, consumerKey],
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

    const updated = await client.query<{
      app_id: string | null;
      developer_id: string;
      api_product: string | null;
      caso_uso: string;
    }>(
      `UPDATE contracting_requests
       SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING app_id, developer_id, api_product, caso_uso`,
      [id, status],
    );

    const current = updated.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    if (status === "approved") {
      if (current.app_id) {
        const appUpdate = await client.query(
          `UPDATE apps
           SET environment = 'production'
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

        const appId = await provisionProductionApp(client, {
          developerId: current.developer_id,
          apiProduct: current.api_product,
          description: current.caso_uso?.trim() || null,
        });

        await client.query(
          `UPDATE contracting_requests
           SET app_id = $2
           WHERE id = $1`,
          [id, appId],
        );
      }
    }

    if (current.app_id && status === "rejected") {
      const appUpdate = await client.query(
        `UPDATE apps
         SET status = 'revoked'
         WHERE id = $1`,
        [current.app_id],
      );

      if ((appUpdate.rowCount ?? 0) !== 1) {
        throw new Error("No se encontró la app vinculada.");
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir la transacción de contratación.",
        rollbackError instanceof Error ? rollbackError.message : rollbackError,
      );
    }

    throw error;
  } finally {
    client.release();
  }

  return getContractingRequest(id);
}
