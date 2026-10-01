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
  app_id: string | null;
  app_name: string | null;
  status: string;
  created_at: Date | string;
};

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
    cr.app_id,
    apps.name AS app_name,
    cr.status,
    cr.created_at
  FROM contracting_requests cr
  LEFT JOIN apps ON apps.id = cr.app_id
`;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
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

export async function updateContractingRequestStatus(
  id: string,
  status: ContractingStatus,
): Promise<AdminContractingRequest | null> {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query<{ app_id: string | null }>(
      `UPDATE contracting_requests
       SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING app_id`,
      [id, status],
    );

    const current = updated.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    if (current.app_id && status === "approved") {
      const appUpdate = await client.query(
        `UPDATE apps
         SET environment = 'production'
         WHERE id = $1`,
        [current.app_id],
      );

      if ((appUpdate.rowCount ?? 0) !== 1) {
        throw new Error("No se encontró la app vinculada.");
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
