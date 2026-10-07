import { AppsTable } from "@/components/dashboard/apps-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AppsPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Apps"
        title="Aplicaciones"
        description="El ambiente pasa a producción al aprobar la contratación vinculada, y el estado queda revocado al rechazarla."
      />
      <AppsTable />
    </main>
  );
}
