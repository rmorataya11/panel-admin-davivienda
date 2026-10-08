"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  emptyStateClass,
  errorTextClass,
  mutedTextClass,
  smallPrimaryClass,
  smallSecondaryClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/dashboard/styles";
import type { AdminContractingRequest, ContractingStatus } from "@/lib/admin/types";
import { adminFetch } from "@/lib/auth/admin-fetch";

const industryLabels: Record<string, string> = {
  fintech: "Fintech",
  retail: "Retail",
  seguros: "Seguros",
  telecomunicaciones: "Telecomunicaciones",
  otro: "Otro",
};

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const typeLabels: Record<string, string> = {
  sandbox: "Sandbox",
  produccion: "Producción",
};

const statusStyles: Record<string, string> = {
  pending: "bg-[#2C2C2C] text-white",
  approved: "bg-[#E1111C] text-white",
  rejected: "bg-[#870412] text-white",
};

const typeStyles: Record<string, string> = {
  sandbox: "border border-[#2C2C2C] text-[#2C2C2C]",
  produccion: "bg-[#E1111C] text-white",
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

function labelFor(value: string, labels: Record<string, string>) {
  return labels[value] ?? value;
}

export function ContractingTable() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminContractingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminFetch("/api/admin/contracting-requests")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar las solicitudes.");
        }

        const data = (await response.json()) as AdminContractingRequest[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar las solicitudes.");
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

  async function updateStatus(id: string, status: ContractingStatus) {
    setPendingId(id);
    setError("");

    try {
      const response = await adminFetch(`/api/admin/contracting-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const body = (await response.json()) as AdminContractingRequest & { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "No se pudo actualizar la solicitud.");
      }

      setRows((current) => current.map((row) => (row.id === id ? body : row)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar la solicitud.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <p className={mutedTextClass}>Cargando solicitudes…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={emptyStateClass}>No hay solicitudes.</p>
      ) : (
        <div className={tableWrapClass}>
          <table className="min-w-280 w-full border-collapse text-left text-sm">
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-3 py-3 font-medium">Tipo</th>
                <th className="px-3 py-3 font-medium">Empresa</th>
                <th className="px-3 py-3 font-medium">API</th>
                <th className="px-3 py-3 font-medium">Desarrollador</th>
                <th className="px-3 py-3 font-medium">App</th>
                <th className="px-3 py-3 font-medium">Estado</th>
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
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs ${typeStyles[row.requestType] ?? "border border-[#2C2C2C]"}`}
                      >
                        {labelFor(row.requestType, typeLabels)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[#2C2C2C]">{row.razonSocial}</p>
                      <p className="text-[#5c5c5c]">{row.nit}</p>
                      <p className="text-[#5c5c5c]">{labelFor(row.industria, industryLabels)}</p>
                    </td>
                    <td className="px-3 py-3">{row.apiName || row.apiProduct || "—"}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[#2C2C2C]">{row.developerName || row.contactoTecnicoNombre}</p>
                      <p className="text-[#5c5c5c]">{row.developerEmail || row.contactoTecnicoEmail}</p>
                    </td>
                    <td className="px-3 py-3">
                      {row.appId && row.appName ? (
                        row.appName
                      ) : (
                        <span className="text-[#5c5c5c]">
                          {row.requestType === "sandbox" ? "Se crea al aprobar sandbox" : "Se crea o promueve al aprobar"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-xs ${statusStyles[row.status] ?? "border border-[#2C2C2C]"}`}
                      >
                        {labelFor(row.status, statusLabels)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busy || row.status === "approved"}
                          onClick={() => updateStatus(row.id, "approved")}
                          className={smallPrimaryClass}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={busy || row.status === "rejected"}
                          onClick={() => updateStatus(row.id, "rejected")}
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
    </div>
  );
}
