import {
  parseCatalogContent,
  parseRequiredText,
  parseSlug,
  type CatalogApiRecord,
  type CatalogContent,
  type CatalogSummary,
} from "@/lib/catalog/content";
import { query } from "@/lib/db/client";

type SummaryRow = {
  id: string;
  slug: string;
  status: string;
  category: string;
  icon: string;
  title_es: string | null;
  title_en: string | null;
};

type DetailRow = {
  id: string;
  slug: string;
  status: string;
  category: string;
  icon: string;
  content_es: unknown;
  content_en: unknown;
};

export type CatalogInput = {
  slug?: string;
  status?: string;
  category?: string;
  icon?: string;
  content_es?: CatalogContent;
  content_en?: CatalogContent;
};

function mapSummary(row: SummaryRow): CatalogSummary {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    category: row.category,
    icon: row.icon,
    titleEs: row.title_es ?? "",
    titleEn: row.title_en ?? "",
  };
}

function mapDetail(row: DetailRow): CatalogApiRecord | null {
  const contentEs = parseCatalogContent(row.content_es, "español");
  const contentEn = parseCatalogContent(row.content_en, "inglés");

  if (!contentEs.ok || !contentEn.ok) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    category: row.category,
    icon: row.icon,
    content_es: contentEs.value,
    content_en: contentEn.value,
  };
}

function readField(body: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (key in body) {
      return { present: true as const, value: body[key] };
    }
  }

  return { present: false as const, value: undefined };
}

export function readCatalogInput(body: unknown, mode: "create" | "update") {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false as const, error: "El cuerpo de la solicitud no es válido." };
  }

  const record = body as Record<string, unknown>;
  const input: CatalogInput = {};

  const slug = readField(record, "slug");
  if (slug.present || mode === "create") {
    const parsed = parseSlug(slug.value);
    if (!parsed.ok) return parsed;
    input.slug = parsed.value;
  }

  const status = readField(record, "status");
  if (status.present || mode === "create") {
    const parsed = parseRequiredText(status.value, "El estado");
    if (!parsed.ok) return parsed;
    input.status = parsed.value;
  }

  const category = readField(record, "category");
  if (category.present || mode === "create") {
    const parsed = parseRequiredText(category.value, "La categoría");
    if (!parsed.ok) return parsed;
    input.category = parsed.value;
  }

  const icon = readField(record, "icon");
  if (icon.present || mode === "create") {
    const parsed = parseRequiredText(icon.value, "El ícono");
    if (!parsed.ok) return parsed;
    input.icon = parsed.value;
  }

  const contentEs = readField(record, "content_es", "contentEs");
  if (contentEs.present || mode === "create") {
    const parsed = parseCatalogContent(contentEs.value, "español");
    if (!parsed.ok) return parsed;
    input.content_es = parsed.value;
  }

  const contentEn = readField(record, "content_en", "contentEn");
  if (contentEn.present || mode === "create") {
    const parsed = parseCatalogContent(contentEn.value, "inglés");
    if (!parsed.ok) return parsed;
    input.content_en = parsed.value;
  }

  if (mode === "update" && Object.keys(input).length === 0) {
    return { ok: false as const, error: "No hay cambios para guardar." };
  }

  return { ok: true as const, value: input };
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function listCatalogApis(): Promise<CatalogSummary[]> {
  const result = await query<SummaryRow>(
    `SELECT
       id,
       slug,
       status,
       category,
       icon,
       content_es->>'title' AS title_es,
       content_en->>'title' AS title_en
     FROM catalog_apis
     ORDER BY created_at DESC`,
  );

  return result.rows.map(mapSummary);
}

export async function getCatalogApi(id: string): Promise<CatalogApiRecord | null> {
  const result = await query<DetailRow>(
    `SELECT id, slug, status, category, icon, content_es, content_en
     FROM catalog_apis
     WHERE id = $1`,
    [id],
  );

  const row = result.rows[0];
  return row ? mapDetail(row) : null;
}

export async function createCatalogApi(input: CatalogInput): Promise<CatalogApiRecord> {
  const result = await query<DetailRow>(
    `INSERT INTO catalog_apis (slug, status, category, icon, content_es, content_en)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
     RETURNING id, slug, status, category, icon, content_es, content_en`,
    [
      input.slug,
      input.status,
      input.category,
      input.icon,
      JSON.stringify(input.content_es),
      JSON.stringify(input.content_en),
    ],
  );

  const created = mapDetail(result.rows[0]);
  if (!created) {
    throw new Error("No se pudo leer la API creada.");
  }

  return created;
}

export async function updateCatalogApi(id: string, input: CatalogInput): Promise<CatalogApiRecord | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  function assign(column: string, value: unknown, jsonb = false) {
    values.push(jsonb ? JSON.stringify(value) : value);
    sets.push(`${column} = $${values.length}${jsonb ? "::jsonb" : ""}`);
  }

  if (input.slug !== undefined) assign("slug", input.slug);
  if (input.status !== undefined) assign("status", input.status);
  if (input.category !== undefined) assign("category", input.category);
  if (input.icon !== undefined) assign("icon", input.icon);
  if (input.content_es !== undefined) assign("content_es", input.content_es, true);
  if (input.content_en !== undefined) assign("content_en", input.content_en, true);

  values.push(id);
  const result = await query<DetailRow>(
    `UPDATE catalog_apis
     SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $${values.length}
     RETURNING id, slug, status, category, icon, content_es, content_en`,
    values,
  );

  const row = result.rows[0];
  return row ? mapDetail(row) : null;
}

export async function deleteCatalogApi(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM catalog_apis WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}
