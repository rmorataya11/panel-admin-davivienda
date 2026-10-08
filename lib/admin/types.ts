export const CONTRACTING_STATUSES = ["pending", "approved", "rejected"] as const;

export type ContractingStatus = (typeof CONTRACTING_STATUSES)[number];

export const SUPPORT_CASE_STATUSES = ["abierto", "resuelto"] as const;

export type SupportCaseStatus = (typeof SUPPORT_CASE_STATUSES)[number];

export const SUPPORT_CASE_SEVERITIES = ["bloqueante", "importante", "consulta"] as const;

export type SupportCaseSeverity = (typeof SUPPORT_CASE_SEVERITIES)[number];

export type AccessRequestType = "sandbox" | "produccion";

export type AdminContractingRequest = {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  razonSocial: string;
  nit: string;
  industria: string;
  casoUso: string;
  volumenEstimado: string;
  ambienteDestino: string;
  requestType: AccessRequestType;
  contactoTecnicoNombre: string;
  contactoTecnicoEmail: string;
  contactoTecnicoTelefono: string | null;
  apiProduct: string | null;
  apiName: string | null;
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

export type AdminDeveloper = {
  id: string;
  email: string;
  fullName: string;
  companyName: string | null;
  nit: string | null;
  dui: string | null;
  phone: string | null;
  sandboxAccess: boolean;
  hasProductionApp: boolean;
  portalDisabled: boolean;
  adminNotes: string | null;
  createdAt: string;
};

export type AdminDeveloperDetail = AdminDeveloper & {
  requests: AdminContractingRequest[];
  apps: AdminApp[];
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

export function normalizeAccessRequestType(value: string): AccessRequestType {
  if (value === "sandbox" || value === "pruebas-extendidas") {
    return "sandbox";
  }

  return "produccion";
}

export function isSandboxRequest(value: string) {
  return normalizeAccessRequestType(value) === "sandbox";
}
