"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  dangerButtonClass,
  dialogClass,
  dialogOverlayClass,
  emptyStateClass,
  errorTextClass,
  mutedTextClass,
  secondaryButtonClass,
  smallPrimaryClass,
  smallSecondaryClass,
  tableClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
  textAreaClass,
} from "@/components/dashboard/styles";
import type { AdminSandboxAppRequest, SandboxAppReviewStatus } from "@/lib/admin/types";
import { adminFetch } from "@/lib/auth/admin-fetch";

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

export function SandboxAppsTable() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminSandboxAppRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminSandboxAppRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;

    adminFetch("/api/admin/sandbox-apps")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar las solicitudes de apps sandbox.");
        }

        const data = (await response.json()) as AdminSandboxAppRequest[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar las solicitudes de apps sandbox.");
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
  }, [router]);

  async function reviewApp(
    id: string,
    status: SandboxAppReviewStatus,
    rejectionReason?: string,
  ) {
    setPendingId(id);
    setError("");

    try {
      const response = await adminFetch(`/api/admin/sandbox-apps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(rejectionReason ? { rejectionReason } : {}),
        }),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const body = (await response.json()) as AdminSandboxAppRequest & { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "No se pudo actualizar la solicitud.");
      }

      setRows((current) => current.filter((row) => row.id !== id));
      setRejectTarget(null);
      setRejectReason("");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <p className={mutedTextClass}>Cargando solicitudes de apps sandbox…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={emptyStateClass}>No hay solicitudes de apps sandbox pendientes.</p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-3 py-3 font-medium">Desarrollador</th>
                <th className="px-3 py-3 font-medium">Empresa</th>
                <th className="px-3 py-3 font-medium">App</th>
                <th className="px-3 py-3 font-medium">API</th>
                <th className="px-3 py-3 font-medium">Descripción</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = pendingId === row.id;

                return (
                  <tr key={row.id} className={tableRowClass}>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[#2C2C2C]">{row.developerName || "—"}</p>
                      <p className="text-[#5c5c5c]">{row.developerEmail}</p>
                    </td>
                    <td className="px-3 py-3">{row.companyName || "—"}</td>
                    <td className="px-3 py-3 font-medium text-[#2C2C2C]">{row.name}</td>
                    <td className="px-3 py-3">{row.apiName || row.apiProduct}</td>
                    <td className="px-3 py-3 max-w-xs text-[#5c5c5c]">
                      {row.description?.trim() || "—"}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => reviewApp(row.id, "active")}
                          className={smallPrimaryClass}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setRejectTarget(row);
                            setRejectReason("");
                            setError("");
                          }}
                          className={smallSecondaryClass}
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-4">
          <button
            type="button"
            className={dialogOverlayClass}
            aria-label="Cerrar rechazo"
            onClick={() => {
              if (!pendingId) {
                setRejectTarget(null);
                setRejectReason("");
              }
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-sandbox-app-title"
            className={dialogClass}
          >
            <h2 id="reject-sandbox-app-title" className="text-lg font-medium text-[#2C2C2C]">
              Rechazar app sandbox
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#2C2C2C]/70">
              Indique el motivo del rechazo de «{rejectTarget.name}». No se generarán credenciales.
            </p>
            <label className="mt-4 flex flex-col gap-1.5 text-sm text-[#2C2C2C]">
              Motivo
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                className={textAreaClass}
                rows={4}
                disabled={Boolean(pendingId)}
                placeholder="Ej. Información incompleta o API no autorizada."
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={Boolean(pendingId)}
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={Boolean(pendingId) || !rejectReason.trim()}
                onClick={() => reviewApp(rejectTarget.id, "rejected", rejectReason.trim())}
                className={dangerButtonClass}
              >
                {pendingId === rejectTarget.id ? "Rechazando…" : "Rechazar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
