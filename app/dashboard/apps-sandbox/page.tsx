import { PageHeader } from "@/components/dashboard/page-header";
import { SandboxAppsTable } from "@/components/dashboard/sandbox-apps-table";

export default function SandboxAppsPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Solicitudes de apps Sandbox"
        description="Apps con environment sandbox y estado pending. Al aprobar, la app pasa a active para que el desarrollador genere credenciales una sola vez en el portal. Al rechazar, queda rejected con motivo. El panel no genera credenciales."
      />
      <SandboxAppsTable />
    </main>
  );
}
