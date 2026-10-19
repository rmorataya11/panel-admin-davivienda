import { PageHeader } from "@/components/dashboard/page-header";
import { SolicitudesPanel } from "@/components/dashboard/solicitudes-panel";

export default function ContractingPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Solicitudes"
        description="Todas las solicitudes en un solo lugar. Filtra por tipo, empresa y fecha. Aprobar una app sandbox solo la activa; las credenciales las genera el desarrollador en el portal."
      />
      <SolicitudesPanel />
    </main>
  );
}
