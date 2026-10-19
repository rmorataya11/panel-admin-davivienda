"use client";

import { useState } from "react";

import { ContractingTable } from "@/components/dashboard/contracting-table";
import { SandboxAppsTable } from "@/components/dashboard/sandbox-apps-table";
import { fieldClass, secondaryButtonClass } from "@/components/dashboard/styles";

export type SolicitudesTipoFilter = "all" | "sandbox" | "produccion" | "apps-sandbox";

const tipoOptions: Array<{ value: SolicitudesTipoFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "sandbox", label: "Sandbox" },
  { value: "produccion", label: "Producción" },
  { value: "apps-sandbox", label: "Apps sandbox" },
];

export function SolicitudesPanel() {
  const [tipo, setTipo] = useState<SolicitudesTipoFilter>("all");
  const [empresa, setEmpresa] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const showContracting = tipo === "all" || tipo === "sandbox" || tipo === "produccion";
  const showSandboxApps = tipo === "all" || tipo === "apps-sandbox";

  const contractingFilter =
    tipo === "sandbox" ? "sandbox" : tipo === "produccion" ? "produccion" : "all";

  const empresaQuery = empresa.trim();

  function clearFilters() {
    setTipo("all");
    setEmpresa("");
    setFechaDesde("");
    setFechaHasta("");
  }

  const hasActiveFilters =
    tipo !== "all" || Boolean(empresaQuery) || Boolean(fechaDesde) || Boolean(fechaHasta);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-3 border border-[#e4e4e4] bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm text-[#2C2C2C]">
          Tipo
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value as SolicitudesTipoFilter)}
            className={fieldClass}
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-[#2C2C2C]">
          Empresa
          <input
            type="search"
            value={empresa}
            onChange={(event) => setEmpresa(event.target.value)}
            placeholder="Nombre o NIT"
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-[#2C2C2C]">
          Fecha desde
          <input
            type="date"
            value={fechaDesde}
            onChange={(event) => setFechaDesde(event.target.value)}
            className={fieldClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-[#2C2C2C]">
          Fecha hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={(event) => setFechaHasta(event.target.value)}
            className={fieldClass}
          />
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`${secondaryButtonClass} w-full`}
          >
            Limpiar
          </button>
        </div>
      </div>

      {showContracting ? (
        <section className="flex flex-col gap-3">
          {tipo === "all" ? (
            <h2 className="text-base font-medium text-[#2C2C2C]">Acceso sandbox y producción</h2>
          ) : null}
          <ContractingTable
            requestTypeFilter={contractingFilter}
            empresaQuery={empresaQuery}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
          />
        </section>
      ) : null}

      {showSandboxApps ? (
        <section className="flex flex-col gap-3">
          {tipo === "all" ? (
            <h2 className="text-base font-medium text-[#2C2C2C]">Apps sandbox pendientes</h2>
          ) : null}
          <SandboxAppsTable
            empresaQuery={empresaQuery}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
          />
        </section>
      ) : null}
    </div>
  );
}
