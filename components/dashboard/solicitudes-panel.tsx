"use client";

import { useState } from "react";

import { ContractingTable } from "@/components/dashboard/contracting-table";
import { SandboxAppsTable } from "@/components/dashboard/sandbox-apps-table";

export type SolicitudesFilter = "all" | "sandbox" | "produccion" | "apps-sandbox";

const filters: Array<{ value: SolicitudesFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "sandbox", label: "Sandbox" },
  { value: "produccion", label: "Producción" },
  { value: "apps-sandbox", label: "Apps sandbox" },
];

function filterButtonClass(active: boolean) {
  return active
    ? "border-b-2 border-[#E1111C] px-3 py-1.5 text-sm font-medium text-[#E1111C]"
    : "border-b-2 border-transparent px-3 py-1.5 text-sm text-[#2C2C2C] hover:text-[#E1111C]";
}

export function SolicitudesPanel() {
  const [filter, setFilter] = useState<SolicitudesFilter>("all");

  const showContracting = filter === "all" || filter === "sandbox" || filter === "produccion";
  const showSandboxApps = filter === "all" || filter === "apps-sandbox";

  const contractingFilter =
    filter === "sandbox" ? "sandbox" : filter === "produccion" ? "produccion" : "all";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={filterButtonClass(filter === item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showContracting ? (
        <section className="flex flex-col gap-3">
          {filter === "all" ? (
            <h2 className="text-base font-medium text-[#2C2C2C]">Acceso sandbox y producción</h2>
          ) : null}
          <ContractingTable requestTypeFilter={contractingFilter} />
        </section>
      ) : null}

      {showSandboxApps ? (
        <section className="flex flex-col gap-3">
          {filter === "all" ? (
            <h2 className="text-base font-medium text-[#2C2C2C]">Apps sandbox pendientes</h2>
          ) : null}
          <SandboxAppsTable />
        </section>
      ) : null}
    </div>
  );
}
