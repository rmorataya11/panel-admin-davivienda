import {
  parseEndpointLocalized,
  parseEndpointMethod,
  parseEndpointPath,
  parseEndpointSlug,
  parseEndpointUrl,
  parseJsonText,
  type EndpointLocalized,
  type EndpointRecord,
  type EndpointSummary,
} from "@/lib/catalog/endpoint";
import { query } from "@/lib/db/client";

type SummaryRow = {
  id: string;
  slug: string;
  method: string;
  path: string;
  description_es: string | null;
};

type DetailRow = {
  id: string;
  catalog_api_id: string;
  slug: string;
  method: string;
  path: string;
  http_url: string;
  content_es: unknown;
  content_en: unknown;
};

export type EndpointInput = {
  slug?: string;
  method?: string;
  path?: string;
  http_url?: string;
  requestBody?: string;
  responseBody?: string;
  content_es?: EndpointLocalized;
  content_en?: EndpointLocalized;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readField(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in body) {
      return { present: true as const, value: body[key] };
    }
  }

  return { present: false as const, value: undefined };
}

export function readEndpointInput(body: unknown, mode: "create" | "update") {
  if (!isRecord(body)) {
    return { ok: false as const, error: "El cuerpo de la solicitud no es válido." };
  }

  const input: EndpointInput = {};

  const slug = readField(body, "slug");
  if (slug.present || mode === "create") {
    const parsed = parseEndpointSlug(slug.value);
    if (!parsed.ok) return parsed;
    input.slug = parsed.value;
  }

  const method = readField(body, "method");
  if (method.present || mode === "create") {
    const parsed = parseEndpointMethod(method.value);
    if (!parsed.ok) return parsed;
    input.method = parsed.value;
  }

  const path = readField(body, "path");
  if (path.present || mode === "create") {
    const parsed = parseEndpointPath(path.value);
    if (!parsed.ok) return parsed;
    input.path = parsed.value;
  }

  const httpUrl = readField(body, "http_url", "httpUrl");
  if (httpUrl.present || mode === "create") {
    const parsed = parseEndpointUrl(httpUrl.value);
    if (!parsed.ok) return parsed;
    input.http_url = parsed.value;
  }

  const requestBody = readField(body, "requestBody", "request_body");
  if (requestBody.present || mode === "create") {
    const parsed = parseJsonText(requestBody.value, "El cuerpo de la petición");
    if (!parsed.ok) return parsed;
    input.requestBody = parsed.value;
  }

  const responseBody = readField(body, "responseBody", "response_body");
  if (responseBody.present || mode === "create") {
    const parsed = parseJsonText(responseBody.value, "El cuerpo de la respuesta");
    if (!parsed.ok) return parsed;
    input.responseBody = parsed.value;
  }

  const contentEs = readField(body, "content_es", "contentEs");
  if (contentEs.present || mode === "create") {
    const parsed = parseEndpointLocalized(contentEs.value, "español");
    if (!parsed.ok) return parsed;
    input.content_es = parsed.value;
  }

  const contentEn = readField(body, "content_en", "contentEn");
  if (contentEn.present || mode === "create") {
    const parsed = parseEndpointLocalized(contentEn.value, "inglés");
    if (!parsed.ok) return parsed;
    input.content_en = parsed.value;
  }

  if (mode === "update" && Object.keys(input).length === 0) {
    return { ok: false as const, error: "No hay cambios para guardar." };
  }

  return { ok: true as const, value: input };
}

function readLocalized(value: unknown, language: string) {
  const parsed = parseEndpointLocalized(value, language);
  return parsed.ok ? parsed.value : null;
}

function mapDetail(row: DetailRow): EndpointRecord | null {
  const contentEs = readLocalized(row.content_es, "español");
  const contentEn = readLocalized(row.content_en, "inglés");
  const storedEs = isRecord(row.content_es) ? row.content_es : null;

  if (!contentEs || !contentEn || !storedEs || typeof storedEs.requestBody !== "string" || typeof storedEs.responseBody !== "string") {
    return null;
  }

  return {
    id: row.id,
    catalogApiId: row.catalog_api_id,
    slug: row.slug,
    method: row.method,
    path: row.path,
    httpUrl: row.http_url,
    requestBody: storedEs.requestBody,
    responseBody: storedEs.responseBody,
    content_es: contentEs,
    content_en: contentEn,
  };
}

function storedContent(
  previous: unknown,
  localized: EndpointLocalized,
  requestBody: string,
  responseBody: string,
) {
  const current = isRecord(previous) ? previous : {};

  return {
    description: localized.description,
    credentialsLabel: localized.credentialsLabel,
    parameters: localized.parameters,
    errors: localized.errors,
    requestBody,
    responseBody,
    responseStatus: typeof current.responseStatus === "string" ? current.responseStatus : "200 OK",
    ...(current.requestExamples !== undefined ? { requestExamples: current.requestExamples } : {}),
    ...(current.responseExamples !== undefined ? { responseExamples: current.responseExamples } : {}),
  };
}

function contentForWrite(previous: unknown, input: EndpointInput, language: "es" | "en") {
  const current = isRecord(previous) ? previous : {};
  const localized = language === "es" ? input.content_es : input.content_en;
  const kept = readLocalized(previous, language === "es" ? "español" : "inglés");
  const nextLocalized = localized ?? kept;

  if (!nextLocalized) {
    return null;
  }

  const requestBody = input.requestBody ?? (typeof current.requestBody === "string" ? current.requestBody : "");
  const responseBody = input.responseBody ?? (typeof current.responseBody === "string" ? current.responseBody : "");

  return storedContent(previous, nextLocalized, requestBody, responseBody);
}

export async function catalogApiExists(apiId: string) {
  const result = await query<{ id: string }>(`SELECT id FROM catalog_apis WHERE id = $1`, [apiId]);
  return Boolean(result.rows[0]);
}

export async function listEndpoints(apiId: string): Promise<EndpointSummary[]> {
  const result = await query<SummaryRow>(
    `SELECT
       id,
       slug,
       method,
       path,
       content_es->>'description' AS description_es
     FROM catalog_endpoints
     WHERE catalog_api_id = $1
     ORDER BY created_at ASC, slug ASC`,
    [apiId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    method: row.method,
    path: row.path,
    descriptionEs: row.description_es ?? "",
  }));
}

export async function getEndpoint(apiId: string, endpointId: string): Promise<EndpointRecord | null> {
  const result = await query<DetailRow>(
    `SELECT id, catalog_api_id, slug, method, path, http_url, content_es, content_en
     FROM catalog_endpoints
     WHERE catalog_api_id = $1 AND id = $2`,
    [apiId, endpointId],
  );

  const row = result.rows[0];
  return row ? mapDetail(row) : null;
}

export async function createEndpoint(apiId: string, input: EndpointInput): Promise<EndpointRecord> {
  const contentEs = storedContent(null, input.content_es as EndpointLocalized, input.requestBody ?? "", input.responseBody ?? "");
  const contentEn = storedContent(null, input.content_en as EndpointLocalized, input.requestBody ?? "", input.responseBody ?? "");
  const result = await query<DetailRow>(
    `INSERT INTO catalog_endpoints (catalog_api_id, slug, method, path, http_url, content_es, content_en)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
     RETURNING id, catalog_api_id, slug, method, path, http_url, content_es, content_en`,
    [apiId, input.slug, input.method, input.path, input.http_url, JSON.stringify(contentEs), JSON.stringify(contentEn)],
  );

  const created = mapDetail(result.rows[0]);
  if (!created) {
    throw new Error("No se pudo leer el endpoint creado.");
  }

  return created;
}

export async function updateEndpoint(
  apiId: string,
  endpointId: string,
  input: EndpointInput,
): Promise<EndpointRecord | null> {
  const current = await query<DetailRow>(
    `SELECT id, catalog_api_id, slug, method, path, http_url, content_es, content_en
     FROM catalog_endpoints
     WHERE catalog_api_id = $1 AND id = $2`,
    [apiId, endpointId],
  );
  const row = current.rows[0];

  if (!row) {
    return null;
  }

  const sets: string[] = [];
  const values: unknown[] = [];

  function assign(column: string, value: unknown, jsonb = false) {
    values.push(jsonb ? JSON.stringify(value) : value);
    sets.push(`${column} = $${values.length}${jsonb ? "::jsonb" : ""}`);
  }

  if (input.slug !== undefined) assign("slug", input.slug);
  if (input.method !== undefined) assign("method", input.method);
  if (input.path !== undefined) assign("path", input.path);
  if (input.http_url !== undefined) assign("http_url", input.http_url);

  const touchesContent =
    input.content_es !== undefined ||
    input.content_en !== undefined ||
    input.requestBody !== undefined ||
    input.responseBody !== undefined;

  if (touchesContent) {
    const contentEs = contentForWrite(row.content_es, input, "es");
    const contentEn = contentForWrite(row.content_en, input, "en");

    if (!contentEs || !contentEn) {
      return null;
    }

    assign("content_es", contentEs, true);
    assign("content_en", contentEn, true);
  }

  values.push(apiId, endpointId);
  const result = await query<DetailRow>(
    `UPDATE catalog_endpoints
     SET ${sets.join(", ")}, updated_at = now()
     WHERE catalog_api_id = $${values.length - 1} AND id = $${values.length}
     RETURNING id, catalog_api_id, slug, method, path, http_url, content_es, content_en`,
    values,
  );

  const updated = result.rows[0];
  return updated ? mapDetail(updated) : null;
}

export async function deleteEndpoint(apiId: string, endpointId: string) {
  const result = await query(`DELETE FROM catalog_endpoints WHERE catalog_api_id = $1 AND id = $2`, [apiId, endpointId]);
  return (result.rowCount ?? 0) > 0;
}
