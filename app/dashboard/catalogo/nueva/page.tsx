import { CatalogForm } from "@/components/dashboard/catalog-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewCatalogApiPage() {
  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Catálogo" title="Nueva API" description="Complete el contenido en español e inglés antes de publicarla." />
      <div className="mt-8">
        <CatalogForm />
      </div>
    </main>
  );
}
