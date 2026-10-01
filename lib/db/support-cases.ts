import { type AdminSupportCase, type SupportCaseStatus } from "@/lib/admin/types";
import { query } from "@/lib/db/client";

type SupportCaseRow = {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: string;
  status: string;
  created_at: Date | string;
};

const columns = `
  id,
  titulo,
  descripcion,
  severidad,
  status,
  created_at
`;

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapSupportCase(row: SupportCaseRow): AdminSupportCase {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion,
    severidad: row.severidad,
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

export async function listSupportCases(): Promise<AdminSupportCase[]> {
  const result = await query<SupportCaseRow>(
    `SELECT ${columns}
     FROM support_cases
     ORDER BY created_at DESC`,
  );

  return result.rows.map(mapSupportCase);
}

export async function updateSupportCaseStatus(
  id: string,
  status: SupportCaseStatus,
): Promise<AdminSupportCase | null> {
  const result = await query<SupportCaseRow>(
    `UPDATE support_cases
     SET status = $2, updated_at = now()
     WHERE id = $1
     RETURNING ${columns}`,
    [id, status],
  );

  const row = result.rows[0];
  return row ? mapSupportCase(row) : null;
}
