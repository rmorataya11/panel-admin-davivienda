"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CatalogForm } from "@/components/dashboard/catalog-form";
import { EndpointTable } from "@/components/dashboard/endpoint-table";

export default function EditCatalogApiPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Editar API</h1>
      <CatalogForm apiId={params.id} />
      <section className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Endpoints</h2>
          <Link href={`/dashboard/catalogo/${params.id}/endpoints`} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
            Ver listado
          </Link>
        </div>
        <EndpointTable apiId={params.id} />
      </section>
    </main>
  );
}
