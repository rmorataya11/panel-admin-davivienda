import { ContractingTable } from "@/components/dashboard/contracting-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function ContractingPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Solicitudes"
        description="Sandbox y producción en un solo listado. Aprobar sandbox libera documentación y crea la app sandbox. Aprobar producción crea o promueve la app de producción. Rechazar solo cambia el estado."
      />
      <ContractingTable />
    </main>
  );
}
