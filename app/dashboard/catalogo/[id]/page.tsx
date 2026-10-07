"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CatalogForm } from "@/components/dashboard/catalog-form";
import { EndpointTable } from "@/components/dashboard/endpoint-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function EditCatalogApiPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Catálogo" title="Editar API" />
      <div className="mt-8">
        <CatalogForm apiId={params.id} />
      </div>
      <section className="mt-12 border-t border-[#2C2C2C]/10 pt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-medium text-[#2C2C2C]">Endpoints</h2>
          <Link href={`/dashboard/catalogo/${params.id}/endpoints`} className="text-sm font-medium text-[#870412] hover:text-[#E1111C]">
            Ver listado
          </Link>
        </div>
        <EndpointTable apiId={params.id} />
      </section>
    </main>
  );
}
