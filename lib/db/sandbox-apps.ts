import type { PoolClient } from "pg";

import type { AdminSandboxAppRequest, SandboxAppReviewStatus } from "@/lib/admin/types";
import { getPool, query } from "@/lib/db/client";

export class SandboxAppNotFoundError extends Error {
  constructor() {
    super("No se encontró la solicitud de app sandbox.");
    this.name = "SandboxAppNotFoundError";
  }
}

export class SandboxAppAlreadyReviewedError extends Error {
  constructor() {
    super("Esta solicitud ya fue resuelta.");
    this.name = "SandboxAppAlreadyReviewedError";
  }
}

export class SandboxAppInvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxAppInvalidStateError";
  }
}

type SandboxAppRow = {
  id: string;
  name: string;
  description: string | null;
  api_product: string;
  api_name: string | null;
  environment: string;
  status: string;
  developer_id: string;
  developer_email: string;
  developer_name: string;
  company_name: string | null;
  created_at: Date | string;
  reviewed_at: Date | string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
};

const selectSql = `
  SELECT
    apps.id,
    apps.name,
    apps.description,
    apps.api_product,
    COALESCE(catalog_apis.content_es->>'title', apps.api_product) AS api_name,
    apps.environment,
    apps.status,
    apps.developer_id,
    developers.email AS developer_email,
    COALESCE(developers.full_name, '') AS developer_name,
    developers.company_name,
    apps.created_at,
    apps.reviewed_at,
    apps.reviewed_by,
    apps.rejection_reason
  FROM apps
  JOIN developers ON developers.id = apps.developer_id
  LEFT JOIN catalog_apis ON catalog_apis.slug = apps.api_product
`;

function toIso(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function mapSandboxApp(row: SandboxAppRow): AdminSandboxAppRequest {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    apiProduct: row.api_product,
    apiName: row.api_name,
    environment: "sandbox",
    status: row.status,
    developerId: row.developer_id,
    developerEmail: row.developer_email,
    developerName: row.developer_name,
    companyName: row.company_name,
    createdAt: toIso(row.created_at) ?? "",
    reviewedAt: toIso(row.reviewed_at),
    reviewedBy: row.reviewed_by,
    rejectionReason: row.rejection_reason,
  };
}

async function getSandboxAppById(
  client: PoolClient | null,
  id: string,
): Promise<AdminSandboxAppRequest | null> {
  const sql = `${selectSql} WHERE apps.id = $1`;

  if (client) {
    const result = await client.query<SandboxAppRow>(sql, [id]);
    const row = result.rows[0];
    return row ? mapSandboxApp(row) : null;
  }

  const result = await query<SandboxAppRow>(sql, [id]);
  const row = result.rows[0];
  return row ? mapSandboxApp(row) : null;
}

export async function listPendingSandboxApps(): Promise<AdminSandboxAppRequest[]> {
  const result = await query<SandboxAppRow>(
    `${selectSql}
     WHERE apps.environment = 'sandbox'
       AND apps.status = 'pending'
     ORDER BY apps.created_at ASC`,
  );

  return result.rows.map(mapSandboxApp);
}

export async function reviewSandboxApp(input: {
  id: string;
  status: SandboxAppReviewStatus;
  reviewedBy: string;
  rejectionReason?: string | null;
}): Promise<AdminSandboxAppRequest> {
  const reason = input.rejectionReason?.trim() || null;

  if (input.status === "rejected" && !reason) {
    throw new SandboxAppInvalidStateError("Debe indicar el motivo del rechazo.");
  }

  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query<{
      environment: string;
      status: string;
    }>(
      `SELECT environment, status
       FROM apps
       WHERE id = $1
       FOR UPDATE`,
      [input.id],
    );

    const current = currentResult.rows[0];
    if (!current) {
      throw new SandboxAppNotFoundError();
    }

    if (current.environment !== "sandbox") {
      throw new SandboxAppInvalidStateError("Solo se pueden revisar apps sandbox.");
    }

    if (current.status !== "pending") {
      throw new SandboxAppAlreadyReviewedError();
    }

    // Solo cambia el estado de revisión. Las credenciales las genera el portal.
    const updated = await client.query(
      `UPDATE apps
       SET status = $2,
           reviewed_at = now(),
           reviewed_by = $3,
           rejection_reason = $4
       WHERE id = $1
         AND environment = 'sandbox'
         AND status = 'pending'`,
      [input.id, input.status, input.reviewedBy, input.status === "rejected" ? reason : null],
    );

    if ((updated.rowCount ?? 0) !== 1) {
      throw new SandboxAppAlreadyReviewedError();
    }

    const reviewed = await getSandboxAppById(client, input.id);
    if (!reviewed) {
      throw new SandboxAppNotFoundError();
    }

    await client.query("COMMIT");
    return reviewed;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "No se pudo revertir la revisión de app sandbox.",
        rollbackError instanceof Error ? rollbackError.message : rollbackError,
      );
    }

    throw error;
  } finally {
    client.release();
  }
}
