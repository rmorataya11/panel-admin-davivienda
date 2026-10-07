"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import {
  ENDPOINT_METHODS,
  PARAMETER_LOCATIONS,
  emptyEndpointLocalized,
  type EndpointErrorItem,
  type EndpointLocalized,
  type EndpointParameter,
  type EndpointRecord,
} from "@/lib/catalog/endpoint";
import {
  backLinkClass,
  errorTextClass,
  fieldClass as inputClass,
  mutedTextClass,
  primaryButtonClass,
  savedTextClass,
  secondaryButtonClass,
  sectionClass,
  smallSecondaryClass,
  tabActiveClass,
  tabIdleClass,
  textAreaClass,
} from "@/components/dashboard/styles";
import { adminFetch } from "@/lib/auth/admin-fetch";

const jsonClass = `${textAreaClass} min-h-40 font-mono text-xs`;

function emptyParameter(): EndpointParameter {
  return { name: "", type: "", required: false, location: "query", description: "" };
}

function emptyError(): EndpointErrorItem {
  return { code: "", title: "", description: "" };
}

function ParameterList({
  items,
  onChange,
}: {
  items: EndpointParameter[];
  onChange: (items: EndpointParameter[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-[#2C2C2C]">Parámetros</legend>
      {items.map((item, index) => (
        <div key={`parameter-${index}`} className="grid gap-2 rounded-2xl border border-[#2C2C2C]/10 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={item.name}
              placeholder="Nombre"
              aria-label={`Nombre del parámetro ${index + 1}`}
              onChange={(event) =>
                onChange(items.map((current, itemIndex) => (itemIndex === index ? { ...current, name: event.target.value } : current)))
              }
              className={inputClass}
            />
            <input
              value={item.type}
              placeholder="Tipo"
              aria-label={`Tipo del parámetro ${index + 1}`}
              onChange={(event) =>
                onChange(items.map((current, itemIndex) => (itemIndex === index ? { ...current, type: event.target.value } : current)))
              }
              className={inputClass}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto]">
            <select
              value={item.location}
              aria-label={`Ubicación del parámetro ${index + 1}`}
              onChange={(event) =>
                onChange(
                  items.map((current, itemIndex) =>
                    itemIndex === index ? { ...current, location: event.target.value as EndpointParameter["location"] } : current,
                  ),
                )
              }
              className={inputClass}
            >
              {PARAMETER_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.required}
                onChange={(event) =>
                  onChange(
                    items.map((current, itemIndex) =>
                      itemIndex === index ? { ...current, required: event.target.checked } : current,
                    ),
                  )
                }
              />
              Obligatorio
            </label>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className={smallSecondaryClass}
            >
              Eliminar
            </button>
          </div>
          <input
            value={item.description}
            placeholder="Descripción"
            aria-label={`Descripción del parámetro ${index + 1}`}
            onChange={(event) =>
              onChange(
                items.map((current, itemIndex) =>
                  itemIndex === index ? { ...current, description: event.target.value } : current,
                ),
              )
            }
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, emptyParameter()])}
        className={`${secondaryButtonClass} self-start`}
      >
        Agregar parámetro
      </button>
    </fieldset>
  );
}

function ErrorList({
  items,
  onChange,
}: {
  items: EndpointErrorItem[];
  onChange: (items: EndpointErrorItem[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-[#2C2C2C]">Errores</legend>
      {items.map((item, index) => (
        <div key={`error-${index}`} className="grid gap-2 rounded-2xl border border-[#2C2C2C]/10 p-4">
          <div className="grid gap-2 sm:grid-cols-[140px_1fr_auto]">
            <input
              value={item.code}
              placeholder="Código"
              aria-label={`Código del error ${index + 1}`}
              onChange={(event) =>
                onChange(items.map((current, itemIndex) => (itemIndex === index ? { ...current, code: event.target.value } : current)))
              }
              className={inputClass}
            />
            <input
              value={item.title}
              placeholder="Título"
              aria-label={`Título del error ${index + 1}`}
              onChange={(event) =>
                onChange(items.map((current, itemIndex) => (itemIndex === index ? { ...current, title: event.target.value } : current)))
              }
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
              className={smallSecondaryClass}
            >
              Eliminar
            </button>
          </div>
          <input
            value={item.description}
            placeholder="Descripción"
            aria-label={`Descripción del error ${index + 1}`}
            onChange={(event) =>
              onChange(
                items.map((current, itemIndex) =>
                  itemIndex === index ? { ...current, description: event.target.value } : current,
                ),
              )
            }
            className={inputClass}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, emptyError()])}
        className={`${secondaryButtonClass} self-start`}
      >
        Agregar error
      </button>
    </fieldset>
  );
}

export function EndpointForm({ apiId, endpointId }: { apiId: string; endpointId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(Boolean(endpointId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [slug, setSlug] = useState("");
  const [method, setMethod] = useState<string>(ENDPOINT_METHODS[1]);
  const [path, setPath] = useState("");
  const [httpUrl, setHttpUrl] = useState("");
  const [requestBody, setRequestBody] = useState("");
  const [responseBody, setResponseBody] = useState("");
  const [contentEs, setContentEs] = useState<EndpointLocalized>(emptyEndpointLocalized());
  const [contentEn, setContentEn] = useState<EndpointLocalized>(emptyEndpointLocalized());

  useEffect(() => {
    if (!endpointId) {
      return;
    }

    let cancelled = false;

    adminFetch(`/api/admin/catalog/${apiId}/endpoints/${endpointId}`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo cargar el endpoint.");
        }

        const data = (await response.json()) as EndpointRecord;
        if (cancelled) {
          return;
        }

        setSlug(data.slug);
        setMethod(data.method);
        setPath(data.path);
        setHttpUrl(data.httpUrl);
        setRequestBody(data.requestBody);
        setResponseBody(data.responseBody);
        setContentEs(data.content_es);
        setContentEn(data.content_en);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar el endpoint.");
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
  }, [apiId, endpointId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const payload = {
      method,
      path,
      http_url: httpUrl,
      requestBody,
      responseBody,
      content_es: contentEs,
      content_en: contentEn,
      ...(endpointId ? {} : { slug }),
    };

    try {
      const response = await adminFetch(
        endpointId ? `/api/admin/catalog/${apiId}/endpoints/${endpointId}` : `/api/admin/catalog/${apiId}/endpoints`,
        {
          method: endpointId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(body?.error || "No se pudo guardar el endpoint.");
      }

      if (!endpointId) {
        router.push(`/dashboard/catalogo/${apiId}/endpoints`);
        return;
      }

      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el endpoint.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className={mutedTextClass}>Cargando endpoint…</p>;
  }

  const content = language === "es" ? contentEs : contentEn;
  const setContent = language === "es" ? setContentEs : setContentEn;
  const methodOptions = (ENDPOINT_METHODS as readonly string[]).includes(method) ? ENDPOINT_METHODS : [method, ...ENDPOINT_METHODS];

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <Link href={`/dashboard/catalogo/${apiId}/endpoints`} className={backLinkClass}>
        Volver a los endpoints
      </Link>

      <section className={sectionClass}>
        {endpointId ? (
          <div className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Slug</span>
            <p className="text-[#2C2C2C]/80">{slug}</p>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Slug
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="consulta-ejemplo"
              className={inputClass}
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Método
          <select value={method} onChange={(event) => setMethod(event.target.value)} className={inputClass}>
            {methodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Path
          <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/ejemplo/ruta/" className={inputClass} required />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          URL
          <input
            value={httpUrl}
            onChange={(event) => setHttpUrl(event.target.value)}
            placeholder="https://api.ejemplo.com/ejemplo/ruta/"
            className={inputClass}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Cuerpo de la petición
          <textarea value={requestBody} onChange={(event) => setRequestBody(event.target.value)} className={jsonClass} spellCheck={false} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Cuerpo de la respuesta
          <textarea value={responseBody} onChange={(event) => setResponseBody(event.target.value)} className={jsonClass} spellCheck={false} />
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
              language === value ? tabActiveClass : tabIdleClass
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className={sectionClass}>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Descripción
        <textarea
          value={content.description}
          onChange={(event) => setContent({ ...content, description: event.target.value })}
          className={textAreaClass}
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Etiqueta de credenciales
        <input
          value={content.credentialsLabel}
          onChange={(event) => setContent({ ...content, credentialsLabel: event.target.value })}
          className={inputClass}
          required
        />
      </label>
      <ParameterList
        items={content.parameters}
        onChange={(parameters) => setContent({ ...content, parameters })}
      />
      <ErrorList items={content.errors} onChange={(errors) => setContent({ ...content, errors })} />
      </div>

      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}
      {saved ? <p className={savedTextClass}>Cambios guardados.</p> : null}

      <button type="submit" disabled={saving} className={`${primaryButtonClass} self-start`}>
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
