import {
  type AdminContractingRequest,
  type ContractingStatus,
} from "@/lib/admin/types";
import { query } from "@/lib/db/client";

type ContractingRequestRow = {
  id: string;
  razon_social: string;
  nit: string;
  industria: string;
  caso_uso: string;
  contacto_tecnico_nombre: string;
  contacto_tecnico_email: string;
  contacto_tecnico_telefono: string | null;
  status: string;
  created_at: Date | string;
};

const columns = `
  id,
  razon_social,
  nit,
  industria,
  caso_uso,
  contacto_tecnico_nombre,
  contacto_tecnico_email,
  contacto_tecnico_telefono,
  status,
  created_at
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
    status: row.status,
    createdAt: toIso(row.created_at),
  };
}

export async function listContractingRequests(): Promise<AdminContractingRequest[]> {
  const result = await query<ContractingRequestRow>(
    `SELECT ${columns}
     FROM contracting_requests
     ORDER BY created_at DESC`,
  );

  return result.rows.map(mapContractingRequest);
}

export async function updateContractingRequestStatus(
  id: string,
  status: ContractingStatus,
): Promise<AdminContractingRequest | null> {
  const result = await query<ContractingRequestRow>(
    `UPDATE contracting_requests
     SET status = $2, updated_at = now()
     WHERE id = $1
     RETURNING ${columns}`,
    [id, status],
  );

  const row = result.rows[0];
  return row ? mapContractingRequest(row) : null;
}
