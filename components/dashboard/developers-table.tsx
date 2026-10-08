"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  emptyStateClass,
  errorTextClass,
  mutedTextClass,
  smallPrimaryClass,
  tableHeadClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/dashboard/styles";
import type { AdminDeveloper } from "@/lib/admin/types";
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

export function DevelopersTable() {
  const router = useRouter();
  const [rows, setRows] = useState<AdminDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    adminFetch("/api/admin/developers")
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok) {
          throw new Error("No se pudieron cargar los usuarios.");
        }

        const data = (await response.json()) as AdminDeveloper[];
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("No se pudieron cargar los usuarios.");
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
    return <p className={mutedTextClass}>Cargando usuarios…</p>;
  }

  if (error) {
    return (
      <p role="alert" className={errorTextClass}>
        {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return <p className={emptyStateClass}>No hay desarrolladores registrados.</p>;
  }

  return (
    <div className={tableWrapClass}>
      <table className="min-w-240 w-full border-collapse text-left text-sm">
        <thead className={tableHeadClass}>
          <tr>
            <th className="px-3 py-3 font-medium">Nombre</th>
            <th className="px-3 py-3 font-medium">Empresa</th>
            <th className="px-3 py-3 font-medium">Correo</th>
            <th className="px-3 py-3 font-medium">NIT</th>
            <th className="px-3 py-3 font-medium">DUI</th>
            <th className="px-3 py-3 font-medium">Sandbox</th>
            <th className="px-3 py-3 font-medium">Producción</th>
            <th className="px-3 py-3 font-medium">Portal</th>
            <th className="px-3 py-3 font-medium">Alta</th>
            <th className="px-3 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={tableRowClass}>
              <td className="px-3 py-3 font-medium text-[#2C2C2C]">{row.fullName}</td>
              <td className="px-3 py-3">{row.companyName || "—"}</td>
              <td className="px-3 py-3">{row.email}</td>
              <td className="px-3 py-3 whitespace-nowrap">{row.nit || "—"}</td>
              <td className="px-3 py-3 whitespace-nowrap">{row.dui || "—"}</td>
              <td className="px-3 py-3">{row.sandboxAccess ? "Sí" : "No"}</td>
              <td className="px-3 py-3">{row.hasProductionApp ? "Sí" : "No"}</td>
              <td className="px-3 py-3">{row.portalDisabled ? "Desactivado" : "Activo"}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatDate(row.createdAt)}</td>
              <td className="px-3 py-3">
                <Link href={`/dashboard/usuarios/${row.id}`} className={smallPrimaryClass}>
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
