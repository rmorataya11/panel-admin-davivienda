"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AdminApp } from "@/lib/admin/types";
import { adminFetch } from "@/lib/auth/admin-fetch";

const environmentLabels: Record<string, string> = {
  sandbox: "Sandbox",
  contracting: "Contratación",
  production: "Producción",
};

const statusLabels: Record<string, string> = {
  active: "Activa",
  revoked: "Revocada",
};

const environmentStyles: Record<string, string> = {
  sandbox: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  contracting: "bg-[#FFF6E8] text-[#A15C12]",
  production: "bg-[#EFFCF5] text-[#347659]",
};

const statusStyles: Record<string, string> = {
  active: "bg-[#EFFCF5] text-[#347659]",
  revoked: "bg-[#FFF1F0] text-[#A11B1B]",
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

export function AppsTable() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    adminFetch("/api/admin/apps")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar las apps.");
        }

        const data = (await response.json()) as AdminApp[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar las apps.");
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

  if (loading) {
    return <p className="text-sm text-zinc-500">Cargando apps…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No hay apps en la base.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-200 border-collapse text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-3 font-medium">Nombre</th>
            <th className="px-3 py-3 font-medium">Desarrollador</th>
            <th className="px-3 py-3 font-medium">Producto</th>
            <th className="px-3 py-3 font-medium">Ambiente</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            <th className="px-3 py-3 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="px-3 py-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</p>
                {row.description ? <p className="mt-1 max-w-xs text-zinc-500">{row.description}</p> : null}
              </td>
              <td className="px-3 py-3">
                <p>{row.developerName}</p>
                <p className="text-zinc-500">{row.developerEmail}</p>
                {row.companyName ? <p className="text-zinc-500">{row.companyName}</p> : null}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{row.apiProduct}</td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${environmentStyles[row.environment] ?? "bg-zinc-100 text-zinc-700"}`}
                >
                  {labelFor(row.environment, environmentLabels)}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
