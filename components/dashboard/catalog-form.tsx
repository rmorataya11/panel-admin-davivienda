"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  CATALOG_STATUSES,
  emptyCatalogContent,
  type CatalogApiRecord,
  type CatalogContent,
  type CatalogFact,
} from "@/lib/catalog/content";
import { adminFetch } from "@/lib/auth/admin-fetch";

const inputClass =
  "h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const textAreaClass =
  "min-h-28 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

function TextListEditor({
  label,
  addLabel,
  items,
  onChange,
}: {
  label: string;
  addLabel: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</legend>
      {items.map((item, index) => (
        <div key={`${label}-${index}`} className="flex gap-2">
          <input
            value={item}
            onChange={(event) =>
              onChange(items.map((current, itemIndex) => (itemIndex === index ? event.target.value : current)))
            }
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            className="h-10 shrink-0 rounded-md border border-zinc-300 px-3 text-xs dark:border-zinc-700"
          >
            Eliminar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="h-9 self-start rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700"
      >
        {addLabel}
      </button>
    </fieldset>
  );
}

function FactListEditor({
  items,
  onChange,
}: {
  items: CatalogFact[];
  onChange: (items: CatalogFact[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Datos rápidos</legend>
      {items.map((item, index) => (
        <div key={`fact-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={item.label}
            placeholder="Etiqueta"
            aria-label={`Etiqueta ${index + 1}`}
            onChange={(event) =>
              onChange(
                items.map((current, itemIndex) =>
                  itemIndex === index ? { ...current, label: event.target.value } : current,
                ),
              )
            }
            className={inputClass}
          />
          <input
            value={item.value}
            placeholder="Valor"
            aria-label={`Valor ${index + 1}`}
            onChange={(event) =>
              onChange(
                items.map((current, itemIndex) =>
                  itemIndex === index ? { ...current, value: event.target.value } : current,
                ),
              )
            }
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
            className="h-10 rounded-md border border-zinc-300 px-3 text-xs dark:border-zinc-700"
          >
            Eliminar
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { label: "", value: "" }])}
        className="h-9 self-start rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700"
      >
        Agregar dato
      </button>
    </fieldset>
  );
}

function ContentFields({
  content,
  onChange,
}: {
  content: CatalogContent;
  onChange: (content: CatalogContent) => void;
}) {
  function patch(partial: Partial<CatalogContent>) {
    onChange({ ...content, ...partial });
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Título
        <input value={content.title} onChange={(event) => patch({ title: event.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Subtítulo
        <input
          value={content.subtitle}
          onChange={(event) => patch({ subtitle: event.target.value })}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Descripción
        <textarea
          value={content.description}
          onChange={(event) => patch({ description: event.target.value })}
          className={textAreaClass}
        />
      </label>
      <TextListEditor
        label="Valor"
        addLabel="Agregar punto"
        items={content.valor}
        onChange={(valor) => patch({ valor })}
      />
      <TextListEditor
        label="Casos de uso"
        addLabel="Agregar punto"
        items={content.casosDeUso}
        onChange={(casosDeUso) => patch({ casosDeUso })}
      />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Mecanismo de autenticación
        <input
          value={content.authentication.mechanism}
          placeholder="x-api-key + Content-Type"
          onChange={(event) =>
            patch({ authentication: { ...content.authentication, mechanism: event.target.value } })
          }
          className={inputClass}
        />
      </label>
      <TextListEditor
        label="Headers"
        addLabel="Agregar header"
        items={content.authentication.headers}
        onChange={(headers) => patch({ authentication: { ...content.authentication, headers } })}
      />
      <TextListEditor
        label="Requisitos"
        addLabel="Agregar punto"
        items={content.requirements}
        onChange={(requirements) => patch({ requirements })}
      />
      <TextListEditor
        label="Pasos"
        addLabel="Agregar punto"
        items={content.journeySteps}
        onChange={(journeySteps) => patch({ journeySteps })}
      />
      <FactListEditor items={content.quickFacts} onChange={(quickFacts) => patch({ quickFacts })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Cobertura
          <input
            value={content.coverage.value}
            placeholder="Valor"
            onChange={(event) => patch({ coverage: { ...content.coverage, value: event.target.value } })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Detalle de cobertura
          <input
            value={content.coverage.detail}
            placeholder="Detalle"
            onChange={(event) => patch({ coverage: { ...content.coverage, detail: event.target.value } })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}

export function CatalogForm({ apiId }: { apiId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(apiId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<string>(CATALOG_STATUSES[0]);
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("");
  const [contentEs, setContentEs] = useState<CatalogContent>(emptyCatalogContent);
  const [contentEn, setContentEn] = useState<CatalogContent>(emptyCatalogContent);

  useEffect(() => {
    if (!apiId) {
      return;
    }

    let cancelled = false;

    adminFetch(`/api/admin/catalog/${apiId}`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo cargar la API.");
        }

        const data = (await response.json()) as CatalogApiRecord;
        if (cancelled) {
          return;
        }

        setSlug(data.slug);
        setStatus(data.status);
        setCategory(data.category);
        setIcon(data.icon);
        setContentEs(data.content_es);
        setContentEn(data.content_en);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar la API.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const payload = {
      status,
      category,
      icon,
      content_es: contentEs,
      content_en: contentEn,
      ...(apiId ? {} : { slug }),
    };

    try {
      const response = await adminFetch(apiId ? `/api/admin/catalog/${apiId}` : "/api/admin/catalog", {
        method: apiId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string; id?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "No se pudo guardar la API.");
      }

      if (!apiId) {
        router.push("/dashboard/catalogo");
        return;
      }

      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar la API.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando API…</p>;
  }

  const content = language === "es" ? contentEs : contentEn;
  const setContent = language === "es" ? setContentEs : setContentEn;
  const statusOptions = CATALOG_STATUSES.includes(status as (typeof CATALOG_STATUSES)[number])
    ? CATALOG_STATUSES
    : [status, ...CATALOG_STATUSES];

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <Link href="/dashboard/catalogo" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
        Volver al catálogo
      </Link>

      <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        {apiId ? (
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Slug</span>
            <p className="text-zinc-700 dark:text-zinc-300">{slug}</p>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Slug
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="api-ejemplo"
              className={inputClass}
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Categoría
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Pagos / Tarjetas"
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Ícono
          <input
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="/catag/icons_apis/api_pay.svg"
            className={inputClass}
            required
          />
        </label>
      </section>

      <div className="flex gap-2" role="tablist" aria-label="Idioma del contenido">
        {(
          [
            ["es", "Español"],
            ["en", "English"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={language === value}
            onClick={() => setLanguage(value)}
            className={
              language === value
                ? "h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "h-9 rounded-md border border-zinc-300 px-4 text-sm dark:border-zinc-700"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <ContentFields content={content} onChange={setContent} />

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {saved ? <p className="text-sm text-emerald-700 dark:text-emerald-400">Cambios guardados.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="h-10 self-start rounded-md bg-zinc-900 px-5 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
