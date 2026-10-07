export const CONTRACTING_STATUSES = ["pending", "approved", "rejected"] as const;

export type ContractingStatus = (typeof CONTRACTING_STATUSES)[number];

export const SUPPORT_CASE_STATUSES = ["abierto", "resuelto"] as const;

export type SupportCaseStatus = (typeof SUPPORT_CASE_STATUSES)[number];

export const SUPPORT_CASE_SEVERITIES = ["bloqueante", "importante", "consulta"] as const;

export type SupportCaseSeverity = (typeof SUPPORT_CASE_SEVERITIES)[number];

export type AdminContractingRequest = {
  id: string;
  razonSocial: string;
  nit: string;
  industria: string;
  casoUso: string;
  contactoTecnicoNombre: string;
  contactoTecnicoEmail: string;
  contactoTecnicoTelefono: string | null;
  appId: string | null;
  appName: string | null;
  status: string;
  createdAt: string;
};

export type AdminApp = {
  id: string;
  name: string;
  description: string | null;
  apiProduct: string;
  environment: string;
  status: string;
  developerEmail: string;
  developerName: string;
  companyName: string | null;
  createdAt: string;
};

export type AdminSupportCase = {
  id: string;
  titulo: string;
  descripcion: string;
  severidad: string;
  status: string;
  createdAt: string;
};

export function isContractingStatus(value: string): value is ContractingStatus {
  return CONTRACTING_STATUSES.includes(value as ContractingStatus);
}

export function isSupportCaseStatus(value: string): value is SupportCaseStatus {
  return SUPPORT_CASE_STATUSES.includes(value as SupportCaseStatus);
}
