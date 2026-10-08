import type { AdminApp, AdminDeveloper, AdminDeveloperDetail } from "@/lib/admin/types";
import { listContractingRequestsByDeveloper } from "@/lib/db/contracting-requests";
import { query } from "@/lib/db/client";

type DeveloperRow = {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  nit: string | null;
  dui: string | null;
  phone: string | null;
  sandbox_access: boolean;
  has_production_app: boolean;
  portal_disabled: boolean;
  admin_notes: string | null;
  created_at: Date | string;
};

type AppRow = {
  id: string;
  name: string;
  description: string | null;
  api_product: string;
  environment: string;
  status: string;
  developer_email: string;
  developer_name: string;
  company_name: string | null;
  created_at: Date | string;
};

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapDeveloper(row: DeveloperRow): AdminDeveloper {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    companyName: row.company_name,
    nit: row.nit,
    dui: row.dui,
    phone: row.phone,
    sandboxAccess: row.sandbox_access === true,
    hasProductionApp: row.has_production_app === true,
    portalDisabled: row.portal_disabled === true,
    adminNotes: row.admin_notes,
    createdAt: toIso(row.created_at),
  };
}

function mapApp(row: AppRow): AdminApp {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    apiProduct: row.api_product,
    environment: row.environment,
    status: row.status,
    developerEmail: row.developer_email,
    developerName: row.developer_name,
    companyName: row.company_name,
    createdAt: toIso(row.created_at),
  };
}

const developerSelect = `
  SELECT
    d.id,
    d.email,
    d.full_name,
    d.company_name,
    (
      SELECT cr.nit
      FROM contracting_requests cr
      WHERE cr.developer_id = d.id
      ORDER BY cr.created_at DESC
      LIMIT 1
    ) AS nit,
    d.dui,
    d.phone,
    (
      d.sandbox_access_granted_at IS NOT NULL
      OR EXISTS (SELECT 1 FROM apps a WHERE a.developer_id = d.id)
      OR EXISTS (
        SELECT 1
        FROM contracting_requests cr
        WHERE cr.developer_id = d.id
          AND cr.status = 'approved'
          AND cr.ambiente_destino IN ('sandbox', 'pruebas-extendidas')
      )
    ) AS sandbox_access,
    EXISTS (
      SELECT 1
      FROM apps a
      WHERE a.developer_id = d.id
        AND a.environment = 'production'
        AND a.status = 'active'
    ) AS has_production_app,
    (d.portal_disabled_at IS NOT NULL) AS portal_disabled,
    d.admin_notes,
    d.created_at
  FROM developers d
`;

export async function listDevelopers(): Promise<AdminDeveloper[]> {
  const result = await query<DeveloperRow>(
    `${developerSelect}
     ORDER BY d.created_at DESC`,
  );

  return result.rows.map(mapDeveloper);
}

export async function getDeveloper(id: string): Promise<AdminDeveloper | null> {
  const result = await query<DeveloperRow>(`${developerSelect} WHERE d.id = $1 LIMIT 1`, [id]);
  const row = result.rows[0];
  return row ? mapDeveloper(row) : null;
}

export async function listAppsByDeveloper(developerId: string): Promise<AdminApp[]> {
  const result = await query<AppRow>(
    `SELECT
       apps.id,
       apps.name,
       apps.description,
       apps.api_product,
       apps.environment,
       apps.status,
       developers.email AS developer_email,
       developers.full_name AS developer_name,
       developers.company_name,
       apps.created_at
     FROM apps
     JOIN developers ON developers.id = apps.developer_id
     WHERE apps.developer_id = $1
     ORDER BY apps.created_at DESC`,
    [developerId],
  );

  return result.rows.map(mapApp);
}

export async function getDeveloperDetail(id: string): Promise<AdminDeveloperDetail | null> {
  const developer = await getDeveloper(id);
  if (!developer) {
    return null;
  }

  const [requests, apps] = await Promise.all([
    listContractingRequestsByDeveloper(id),
    listAppsByDeveloper(id),
  ]);

  return { ...developer, requests, apps };
}

export type DeveloperPatch = {
  portalDisabled?: boolean;
  revokeSandbox?: boolean;
  adminNotes?: string | null;
};

export async function updateDeveloper(
  id: string,
  patch: DeveloperPatch,
): Promise<AdminDeveloper | null> {
  const current = await getDeveloper(id);
  if (!current) {
    return null;
  }

  if (patch.portalDisabled !== undefined) {
    await query(
      `UPDATE developers
       SET portal_disabled_at = CASE WHEN $2 THEN COALESCE(portal_disabled_at, now()) ELSE NULL END,
           updated_at = now()
       WHERE id = $1`,
      [id, patch.portalDisabled],
    );
  }

  if (patch.adminNotes !== undefined) {
    await query(
      `UPDATE developers
       SET admin_notes = $2,
           updated_at = now()
       WHERE id = $1`,
      [id, patch.adminNotes],
    );
  }

  if (patch.revokeSandbox) {
    await query(
      `UPDATE developers
       SET sandbox_access_granted_at = NULL,
           updated_at = now()
       WHERE id = $1`,
      [id],
    );

    await query(
      `UPDATE apps
       SET status = 'revoked'
       WHERE developer_id = $1
         AND environment IN ('sandbox', 'contracting')`,
      [id],
    );
  }

  return getDeveloper(id);
}
