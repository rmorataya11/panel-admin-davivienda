"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  dangerButtonClass,
  dialogClass,
  dialogOverlayClass,
  emptyStateClass,
  errorTextClass,
  mutedTextClass,
  primaryButtonClass,
  secondaryButtonClass,
  smallPrimaryClass,
  smallSecondaryClass,
  tableClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/dashboard/styles";
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
    return <p className={mutedTextClass}>Cargando endpoints…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href={`/dashboard/catalogo/${apiId}/endpoints/nuevo`} className={primaryButtonClass}>
          Nuevo endpoint
        </Link>
      </div>

      {error ? (
        <p role="alert" className={errorTextClass}>
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={emptyStateClass}>Esta API no tiene endpoints.</p>
      ) : (
        <div className={tableWrapClass}>
          <table className={tableClass}>
            <thead className={tableHeadClass}>
              <tr>
                <th className="px-3 py-3 font-medium">Método</th>
                <th className="px-3 py-3 font-medium">Path</th>
                <th className="px-3 py-3 font-medium">Descripción</th>
                <th className="px-3 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={tableRowClass}>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-flex bg-[#E1111C] px-1.5 py-0.5 text-xs font-medium text-white">
                      {row.method}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{row.path}</td>
                  <td className="px-3 py-3">{row.descriptionEs || "Sin descripción"}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/catalogo/${apiId}/endpoints/${row.id}`}
                        className={smallPrimaryClass}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(row)}
                        className={smallSecondaryClass}
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
            className={dialogOverlayClass}
            aria-label="Cerrar confirmación"
            onClick={() => {
              if (!deleting) setPendingDelete(null);
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-endpoint-title"
            className={dialogClass}
          >
            <h2 id="delete-endpoint-title" className="text-lg font-medium text-[#2C2C2C]">
              Eliminar endpoint
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#2C2C2C]/70">
              Se eliminará {pendingDelete.method} {pendingDelete.path}. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
                className={secondaryButtonClass}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className={dangerButtonClass}
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
