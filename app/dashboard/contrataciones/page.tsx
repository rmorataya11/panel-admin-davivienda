import { ContractingTable } from "@/components/dashboard/contracting-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function ContractingPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Contrataciones"
        title="Solicitudes"
        description="Al aprobar, la app vinculada pasa a producción. Al rechazar, esa app se revoca. Sin app vinculada, solo cambia el estado de la solicitud."
      />
      <ContractingTable />
    </main>
  );
}
