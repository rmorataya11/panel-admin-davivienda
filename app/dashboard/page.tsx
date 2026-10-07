import { PageHeader } from "@/components/dashboard/page-header";

export default function DashboardPage() {
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Inicio"
        title="Bienvenido al panel de administración"
        description="Use el menú lateral para ir a contrataciones, soporte, catálogo y apps."
      />
    </main>
  );
}
