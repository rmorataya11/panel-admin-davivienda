"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { emptyStateClass, errorTextClass, mutedTextClass, tableClass, tableHeadClass, tableRowClass, tableWrapClass } from "@/components/dashboard/styles";
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
  sandbox: "border border-[#2C2C2C]/15 bg-white text-[#2C2C2C]",
  contracting: "bg-[#2C2C2C] text-white",
  production: "bg-[#E1111C] text-white",
};

const statusStyles: Record<string, string> = {
  active: "bg-[#E1111C] text-white",
  revoked: "bg-[#870412] text-white",
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
    return <p className={mutedTextClass}>Cargando apps…</p>;
  }

  if (error) {
    return (
      <p role="alert" className={errorTextClass}>
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return <p className={emptyStateClass}>No hay apps en la base.</p>;
  }

  return (
    <div className={tableWrapClass}>
      <table className={tableClass}>
        <thead className={tableHeadClass}>
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
            <tr key={row.id} className={tableRowClass}>
              <td className="px-3 py-3">
                <p className="font-medium text-[#2C2C2C]">{row.name}</p>
                {row.description ? <p className="mt-1 max-w-xs text-[#2C2C2C]/60">{row.description}</p> : null}
              </td>
              <td className="px-3 py-3">
                <p>{row.developerName}</p>
                <p className="text-[#2C2C2C]/60">{row.developerEmail}</p>
                {row.companyName ? <p className="text-[#2C2C2C]/60">{row.companyName}</p> : null}
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{row.apiProduct}</td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${environmentStyles[row.environment] ?? "border border-[#2C2C2C]/15 bg-white text-[#2C2C2C]"}`}
                >
                  {labelFor(row.environment, environmentLabels)}
                </span>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[row.status] ?? "border border-[#2C2C2C]/15 bg-white text-[#2C2C2C]"}`}
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
