"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { EndpointSummary } from "@/lib/catalog/endpoint";
import { adminFetch } from "@/lib/auth/admin-fetch";

export function EndpointTable({ apiId }: { apiId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<EndpointSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<EndpointSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    adminFetch(`/api/admin/catalog/${apiId}/endpoints`)
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar los endpoints.");
        }

        const data = (await response.json()) as EndpointSummary[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los endpoints.");
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

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await adminFetch(`/api/admin/catalog/${apiId}/endpoints/${pendingDelete.id}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error("No se pudo eliminar el endpoint.");
      }

      setRows((current) => current.filter((row) => row.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el endpoint.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando endpoints…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/catalogo/${apiId}/endpoints/nuevo`}
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nuevo endpoint
        </Link>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">Esta API no tiene endpoints.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-200 border-collapse text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-3 font-medium">Método</th>
                <th className="px-3 py-3 font-medium">Path</th>
                <th className="px-3 py-3 font-medium">Descripción</th>
                <th className="px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-3 font-medium whitespace-nowrap text-zinc-900 dark:text-zinc-100">
                    {row.method}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{row.path}</td>
                  <td className="px-3 py-3">{row.descriptionEs || "Sin descripción"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/catalogo/${apiId}/endpoints/${row.id}`}
                        className="inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(row)}
                        className="h-8 rounded-md border border-zinc-300 px-3 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pendingDelete ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/40"
            aria-label="Cerrar confirmación"
            onClick={() => {
              if (!deleting) setPendingDelete(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-endpoint-title"
            className="relative z-10 w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h2 id="delete-endpoint-title" className="text-lg font-semibold">
              Eliminar endpoint
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Se eliminará {pendingDelete.method} {pendingDelete.path}. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="h-9 rounded-md bg-red-700 px-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
