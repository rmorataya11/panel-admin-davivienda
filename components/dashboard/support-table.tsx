"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AdminSupportCase } from "@/lib/admin/types";
import { adminFetch } from "@/lib/auth/admin-fetch";

const severityLabels: Record<string, string> = {
  bloqueante: "Bloqueante",
  importante: "Importante",
  consulta: "Consulta",
};

const severityStyles: Record<string, string> = {
  bloqueante: "bg-[#E1251B] text-white",
  importante: "bg-[#141F25] text-white",
  consulta: "bg-[#5B636A] text-white",
};

const statusLabels: Record<string, string> = {
  abierto: "Abierto",
  resuelto: "Resuelto",
};

const statusStyles: Record<string, string> = {
  abierto: "bg-[#FFF6E8] text-[#A15C12]",
  resuelto: "bg-[#EFFCF5] text-[#347659]",
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

export function SupportTable() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminSupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminFetch("/api/admin/support-cases")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar los casos.");
        }

        const data = (await response.json()) as AdminSupportCase[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los casos.");
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

  async function markResolved(id: string) {
    setPendingId(id);
    setError("");

    try {
      const response = await adminFetch(`/api/admin/support-cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resuelto" }),
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      const body = (await response.json()) as AdminSupportCase & { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "No se pudo actualizar el caso.");
      }

      setRows((current) => current.map((row) => (row.id === id ? body : row)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "No se pudo actualizar el caso.");
    } finally {
      setPendingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando casos…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay casos de soporte.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-215 w-full border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-3 font-medium">Título</th>
                <th className="px-3 py-3 font-medium">Descripción</th>
                <th className="px-3 py-3 font-medium">Severidad</th>
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
                    <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">{row.titulo}</td>
                    <td className="max-w-md px-3 py-3">
                      <p className="line-clamp-3 whitespace-pre-wrap">{row.descripcion}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${severityStyles[row.severidad] ?? "bg-zinc-200 text-zinc-800"}`}
                      >
                        {labelFor(row.severidad, severityLabels)}
                      </span>
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
                      <button
                        type="button"
                        disabled={busy || row.status === "resuelto"}
                        onClick={() => markResolved(row.id)}
                        className="h-8 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        Marcar como resuelto
                      </button>
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
