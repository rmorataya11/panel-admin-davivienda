import { CatalogTable } from "@/components/dashboard/catalog-table";

export default function CatalogPage() {
  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de APIs</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Estas APIs se muestran en el catálogo público del portal.
        </p>
      </div>
      <CatalogTable />
    </main>
  );
}
