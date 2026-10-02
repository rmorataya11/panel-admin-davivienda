import { parseRequiredText, parseSlug } from "@/lib/catalog/content";

export const ENDPOINT_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
export const PARAMETER_LOCATIONS = ["query", "path", "header", "body"] as const;

export type EndpointMethod = (typeof ENDPOINT_METHODS)[number];
export type ParameterLocation = (typeof PARAMETER_LOCATIONS)[number];

export type EndpointParameter = {
  name: string;
  type: string;
  required: boolean;
  location: ParameterLocation;
  description: string;
};

export type EndpointErrorItem = {
  code: string;
  title: string;
  description: string;
};

export type EndpointLocalized = {
  description: string;
  credentialsLabel: string;
  parameters: EndpointParameter[];
  errors: EndpointErrorItem[];
};

export type EndpointSummary = {
  id: string;
  slug: string;
  method: string;
  path: string;
  descriptionEs: string;
};

export type EndpointRecord = {
  id: string;
  catalogApiId: string;
  slug: string;
  method: string;
  path: string;
  httpUrl: string;
  requestBody: string;
  responseBody: string;
  content_es: EndpointLocalized;
  content_en: EndpointLocalized;
};

export function emptyEndpointLocalized(): EndpointLocalized {
  return {
    description: "",
    credentialsLabel: "",
    parameters: [],
    errors: [],
  };
}

function fail(error: string) {
  return { ok: false as const, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseEndpointLocalized(value: unknown, language: string) {
  if (!isRecord(value)) {
    return fail(`El contenido en ${language} no es válido.`);
  }

  const description = readText(value.description);
  const credentialsLabel = readText(value.credentialsLabel);

  if (!description || !credentialsLabel) {
    return fail(`En ${language}, la descripción y la etiqueta de credenciales son obligatorias.`);
  }

  if (!Array.isArray(value.parameters)) {
    return fail(`En ${language}, los parámetros deben ser una lista.`);
  }

  const parameters: EndpointParameter[] = [];

  for (const item of value.parameters) {
    if (!isRecord(item)) {
      return fail(`En ${language}, cada parámetro debe incluir nombre, tipo, ubicación y descripción.`);
    }

    const name = readText(item.name);
    const type = readText(item.type);
    const descriptionText = readText(item.description);
    const location = item.location;

    if (!name && !type && !descriptionText) {
      continue;
    }

    if (
      !name ||
      !type ||
      !descriptionText ||
      typeof item.required !== "boolean" ||
      (location !== "query" && location !== "path" && location !== "header" && location !== "body")
    ) {
      return fail(`En ${language}, cada parámetro debe incluir nombre, tipo, ubicación y descripción.`);
    }

    parameters.push({
      name,
      type,
      required: item.required,
      location,
      description: descriptionText,
    });
  }

  if (!Array.isArray(value.errors)) {
    return fail(`En ${language}, los errores deben ser una lista.`);
  }

  const errors: EndpointErrorItem[] = [];

  for (const item of value.errors) {
    if (!isRecord(item)) {
      return fail(`En ${language}, cada error debe incluir código, título y descripción.`);
    }

    const code = readText(item.code);
    const title = readText(item.title);
    const descriptionText = readText(item.description);

    if (!code && !title && !descriptionText) {
      continue;
    }

    if (!code || !title || !descriptionText) {
      return fail(`En ${language}, cada error debe incluir código, título y descripción.`);
    }

    errors.push({ code, title, description: descriptionText });
  }

  return {
    ok: true as const,
    value: { description, credentialsLabel, parameters, errors },
  };
}

export function parseEndpointMethod(value: unknown) {
  const method = readText(value).toUpperCase();

  if (!(ENDPOINT_METHODS as readonly string[]).includes(method)) {
    return fail("El método debe ser GET, POST, PUT, DELETE o PATCH.");
  }

  return { ok: true as const, value: method };
}

export function parseJsonText(value: unknown, label: string) {
  if (typeof value !== "string") {
    return fail(`${label} debe ser texto.`);
  }

  return { ok: true as const, value };
}

export function parseEndpointSlug(value: unknown) {
  return parseSlug(value);
}

export function parseEndpointPath(value: unknown) {
  return parseRequiredText(value, "El path");
}

export function parseEndpointUrl(value: unknown) {
  return parseRequiredText(value, "La URL");
}
