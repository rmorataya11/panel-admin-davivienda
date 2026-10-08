import { AppsTable } from "@/components/dashboard/apps-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AppsPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        title="Aplicaciones"
        description="Incluye apps sandbox creadas al aprobar acceso, apps en contratación y apps en producción."
      />
      <AppsTable />
    </main>
  );
}
