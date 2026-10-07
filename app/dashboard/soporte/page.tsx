import { PageHeader } from "@/components/dashboard/page-header";
import { SupportTable } from "@/components/dashboard/support-table";

export default function SupportPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Soporte"
        title="Casos"
        description="Revise los casos abiertos y márquelos como resueltos cuando el desarrollador ya tenga respuesta."
      />
      <SupportTable />
    </main>
  );
}
