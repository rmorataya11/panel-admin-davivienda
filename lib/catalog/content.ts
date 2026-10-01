export const CATALOG_STATUSES = ["Producción"] as const;

export type CatalogFact = {
  label: string;
  value: string;
};

export type CatalogCoverage = {
  value: string;
  detail: string;
};

export type CatalogContent = {
  title: string;
  subtitle: string;
  description: string;
  valor: string[];
  casosDeUso: string[];
  authentication: {
    mechanism: string;
    headers: string[];
  };
  requirements: string[];
  journeySteps: string[];
  quickFacts: CatalogFact[];
  coverage: CatalogCoverage;
};

export type CatalogSummary = {
  id: string;
  slug: string;
  status: string;
  category: string;
  icon: string;
  titleEs: string;
  titleEn: string;
};

export type CatalogApiRecord = {
  id: string;
  slug: string;
  status: string;
  category: string;
  icon: string;
  content_es: CatalogContent;
  content_en: CatalogContent;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function emptyCatalogContent(): CatalogContent {
  return {
    title: "",
    subtitle: "",
    description: "",
    valor: [],
    casosDeUso: [],
    authentication: { mechanism: "", headers: [] },
    requirements: [],
    journeySteps: [],
    quickFacts: [],
    coverage: { value: "", detail: "" },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function fail(error: string) {
  return { ok: false as const, error };
}

function readStringList(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    return fail(`${label} debe ser una lista.`);
  }

  const items: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      return fail(`${label} solo admite texto.`);
    }

    const trimmed = item.trim();
    if (trimmed) {
      items.push(trimmed);
    }
  }

  return { ok: true as const, value: items };
}

export function parseCatalogContent(value: unknown, language: string) {
  if (!isRecord(value)) {
    return fail(`El contenido en ${language} no es válido.`);
  }

  const title = typeof value.title === "string" ? value.title.trim() : "";
  const subtitle = typeof value.subtitle === "string" ? value.subtitle.trim() : "";
  const description = typeof value.description === "string" ? value.description.trim() : "";

  if (!title || !subtitle || !description) {
    return fail(`En ${language}, el título, el subtítulo y la descripción son obligatorios.`);
  }

  if (!isRecord(value.authentication)) {
    return fail(`En ${language}, la autenticación no es válida.`);
  }

  const mechanism =
    typeof value.authentication.mechanism === "string" ? value.authentication.mechanism.trim() : "";

  if (!mechanism) {
    return fail(`En ${language}, el mecanismo de autenticación es obligatorio.`);
  }

  const valor = readStringList(value.valor, `En ${language}, valor`);
  if (!valor.ok) return valor;
  const casosDeUso = readStringList(value.casosDeUso, `En ${language}, casos de uso`);
  if (!casosDeUso.ok) return casosDeUso;
  const headers = readStringList(value.authentication.headers, `En ${language}, los headers`);
  if (!headers.ok) return headers;
  const requirements = readStringList(value.requirements, `En ${language}, los requisitos`);
  if (!requirements.ok) return requirements;
  const journeySteps = readStringList(value.journeySteps, `En ${language}, los pasos`);
  if (!journeySteps.ok) return journeySteps;

  if (!Array.isArray(value.quickFacts)) {
    return fail(`En ${language}, los datos rápidos deben ser una lista.`);
  }

  const quickFacts: CatalogFact[] = [];

  for (const item of value.quickFacts) {
    if (!isRecord(item) || typeof item.label !== "string" || typeof item.value !== "string") {
      return fail(`En ${language}, cada dato rápido necesita etiqueta y valor.`);
    }

    const label = item.label.trim();
    const factValue = item.value.trim();

    if (!label && !factValue) {
      continue;
    }

    if (!label || !factValue) {
      return fail(`En ${language}, cada dato rápido necesita etiqueta y valor.`);
    }

    quickFacts.push({ label, value: factValue });
  }

  if (!isRecord(value.coverage)) {
    return fail(`En ${language}, la cobertura no es válida.`);
  }

  const coverageValue = typeof value.coverage.value === "string" ? value.coverage.value.trim() : "";
  const coverageDetail = typeof value.coverage.detail === "string" ? value.coverage.detail.trim() : "";

  if (!coverageValue || !coverageDetail) {
    return fail(`En ${language}, la cobertura necesita valor y detalle.`);
  }

  const content: CatalogContent = {
    title,
    subtitle,
    description,
    valor: valor.value,
    casosDeUso: casosDeUso.value,
    authentication: { mechanism, headers: headers.value },
    requirements: requirements.value,
    journeySteps: journeySteps.value,
    quickFacts,
    coverage: { value: coverageValue, detail: coverageDetail },
  };

  return { ok: true as const, value: content };
}

export function parseSlug(value: unknown) {
  const slug = typeof value === "string" ? value.trim() : "";

  if (!SLUG_PATTERN.test(slug)) {
    return fail("El slug solo puede tener minúsculas, números y guiones.");
  }

  return { ok: true as const, value: slug };
}

export function parseRequiredText(value: unknown, label: string) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    return fail(`${label} es obligatorio.`);
  }

  return { ok: true as const, value: text };
}
