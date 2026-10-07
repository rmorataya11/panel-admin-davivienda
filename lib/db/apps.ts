import type { AdminApp } from "@/lib/admin/types";
import { query } from "@/lib/db/client";

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

export async function listApps(): Promise<AdminApp[]> {
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
     ORDER BY apps.created_at DESC`,
  );

  return result.rows.map(mapApp);
}
