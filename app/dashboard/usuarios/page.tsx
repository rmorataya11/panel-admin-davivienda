import { DevelopersTable } from "@/components/dashboard/developers-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function UsersPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Usuarios"
        description="Desarrolladores del portal. Puede activar o desactivar el acceso, revocar sandbox y ver solicitudes y apps."
      />
      <DevelopersTable />
    </main>
  );
}
