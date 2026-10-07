import { CatalogTable } from "@/components/dashboard/catalog-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function CatalogPage() {
  return (
    <main className="flex flex-col gap-8 px-4 py-8 sm:px-8">
      <PageHeader
        eyebrow="Catálogo"
        title="APIs del portal"
        description="Estas APIs se muestran en el catálogo público. El slug no se puede cambiar después de crearlas."
      />
      <CatalogTable />
    </main>
  );
}
