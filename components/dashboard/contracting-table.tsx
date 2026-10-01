"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const statusStyles: Record<string, string> = {
  pending: "bg-[#FFF6E8] text-[#A15C12]",
  approved: "bg-[#EFFCF5] text-[#347659]",
  rejected: "bg-[#FFF1F0] text-[#A11B1B]",
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
    return <p className="text-sm text-zinc-500">Cargando solicitudes…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay solicitudes de contratación.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-280 w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-3 font-medium">Razón social</th>
                <th className="px-3 py-3 font-medium">App</th>
                <th className="px-3 py-3 font-medium">NIT</th>
                <th className="px-3 py-3 font-medium">Industria</th>
                <th className="px-3 py-3 font-medium">Caso de uso</th>
                <th className="px-3 py-3 font-medium">Contacto técnico</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = pendingId === row.id;

                return (
                  <tr key={row.id} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                    <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.razonSocial}</td>
                    <td className="px-3 py-3">
                      {row.appId && row.appName ? (
                        row.appName
                      ) : (
                        <span className="text-zinc-500">Sin app vinculada</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{row.nit}</td>
                    <td className="px-3 py-3">{labelFor(row.industria, industryLabels)}</td>
                    <td className="max-w-xs px-3 py-3">
                      <p className="line-clamp-3 whitespace-pre-wrap">{row.casoUso}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.contactoTecnicoNombre}</p>
                      <p>{row.contactoTecnicoEmail}</p>
                      <p>{row.contactoTecnicoTelefono || "—"}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status] ?? "bg-zinc-100 text-zinc-700"}`}
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
                          className="h-8 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          disabled={busy || row.status === "rejected"}
                          onClick={() => updateStatus(row.id, "rejected")}
                          className="h-8 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-100"
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
