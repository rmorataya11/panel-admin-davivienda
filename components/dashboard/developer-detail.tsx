"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  backLinkClass,
  emptyStateClass,
  errorTextClass,
  mutedTextClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionClass,
  smallSecondaryClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
  textAreaClass,
} from "@/components/dashboard/styles";
import type { AdminDeveloperDetail } from "@/lib/admin/types";
import { adminFetch } from "@/lib/auth/admin-fetch";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const typeLabels: Record<string, string> = {
  sandbox: "Sandbox",
  produccion: "Producción",
};

const environmentLabels: Record<string, string> = {
  sandbox: "Sandbox",
  contracting: "Contratación",
  production: "Producción",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DeveloperDetail({ developerId }: { developerId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<AdminDeveloperDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    adminFetch(`/api/admin/developers/${developerId}`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudo cargar el usuario.");
        }

        const data = (await response.json()) as AdminDeveloperDetail;
        if (!cancelled) {
          setDetail(data);
          setNotes(data.adminNotes ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudo cargar el usuario.");
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
  }, [developerId, router]);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setSaved(false);

    try {
      const response = await adminFetch(`/api/admin/developers/${developerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const payload = (await response.json()) as AdminDeveloperDetail & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No se pudo actualizar el usuario.");
      }

      const refreshed = await adminFetch(`/api/admin/developers/${developerId}`);
      if (refreshed.ok) {
        const data = (await refreshed.json()) as AdminDeveloperDetail;
        setDetail(data);
        setNotes(data.adminNotes ?? "");
      } else {
        setDetail((current) => (current ? { ...current, ...payload } : current));
      }
      setSaved(true);
    } catch (patchError) {
      setError(patchError instanceof Error ? patchError.message : "No se pudo actualizar el usuario.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className={mutedTextClass}>Cargando usuario…</p>;
  }

  if (!detail) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/usuarios" className={backLinkClass}>
          Volver a usuarios
        </Link>
        <p role="alert" className={errorTextClass}>
          {error || "No se encontró el usuario."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/usuarios" className={backLinkClass}>
        Volver a usuarios
      </Link>

      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}
      {saved ? <p className={mutedTextClass}>Cambios guardados.</p> : null}

      <section className={sectionClass}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[#5c5c5c]">Nombre</p>
            <p className="font-medium text-[#2C2C2C]">{detail.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Correo</p>
            <p className="font-medium text-[#2C2C2C]">{detail.email}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Empresa</p>
            <p>{detail.companyName || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Teléfono</p>
            <p>{detail.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">NIT</p>
            <p>{detail.nit || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">DUI</p>
            <p>{detail.dui || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Sandbox</p>
            <p>{detail.sandboxAccess ? "Sí" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Producción</p>
            <p>{detail.hasProductionApp ? "Sí" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Portal</p>
            <p>{detail.portalDisabled ? "Desactivado" : "Activo"}</p>
          </div>
          <div>
            <p className="text-xs text-[#5c5c5c]">Alta</p>
            <p>{formatDate(detail.createdAt)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            disabled={busy}
            className={detail.portalDisabled ? primaryButtonClass : secondaryButtonClass}
            onClick={() => patch({ portalDisabled: !detail.portalDisabled })}
          >
            {detail.portalDisabled ? "Activar acceso" : "Desactivar acceso"}
          </button>
          <button
            type="button"
            disabled={busy || !detail.sandboxAccess}
            className={smallSecondaryClass}
            onClick={() => {
              if (window.confirm("¿Revocar sandbox? Se quitará el acceso a docs y se revocarán apps sandbox.")) {
                void patch({ revokeSandbox: true });
              }
            }}
          >
            Revocar sandbox
          </button>
        </div>
      </section>

      <section className={sectionClass}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#2C2C2C]">
          Notas internas
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={textAreaClass}
            rows={4}
          />
        </label>
        <button
          type="button"
          disabled={busy}
          className={`${primaryButtonClass} self-start`}
          onClick={() => patch({ adminNotes: notes })}
        >
          Guardar notas
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-[#2C2C2C]">Solicitudes</h2>
        {detail.requests.length === 0 ? (
          <p className={emptyStateClass}>Sin solicitudes.</p>
        ) : (
          <div className={tableWrapClass}>
            <table className="w-full min-w-200 border-collapse text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-3 py-3 font-medium">Tipo</th>
                  <th className="px-3 py-3 font-medium">API</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {detail.requests.map((row) => (
                  <tr key={row.id} className={tableRowClass}>
                    <td className="px-3 py-3">{typeLabels[row.requestType] ?? row.ambienteDestino}</td>
                    <td className="px-3 py-3">{row.apiName || row.apiProduct || "—"}</td>
                    <td className="px-3 py-3">{statusLabels[row.status] ?? row.status}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-[#2C2C2C]">Apps</h2>
        {detail.apps.length === 0 ? (
          <p className={emptyStateClass}>Sin apps.</p>
        ) : (
          <div className={tableWrapClass}>
            <table className="w-full min-w-200 border-collapse text-left text-sm">
              <thead className={tableHeadClass}>
                <tr>
                  <th className="px-3 py-3 font-medium">Nombre</th>
                  <th className="px-3 py-3 font-medium">Producto</th>
                  <th className="px-3 py-3 font-medium">Ambiente</th>
                  <th className="px-3 py-3 font-medium">Estado</th>
                  <th className="px-3 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {detail.apps.map((row) => (
                  <tr key={row.id} className={tableRowClass}>
                    <td className="px-3 py-3 font-medium text-[#2C2C2C]">{row.name}</td>
                    <td className="px-3 py-3">{row.apiProduct}</td>
                    <td className="px-3 py-3">{environmentLabels[row.environment] ?? row.environment}</td>
                    <td className="px-3 py-3">{row.status === "active" ? "Activa" : "Revocada"}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
