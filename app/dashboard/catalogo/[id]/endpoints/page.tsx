"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EndpointTable } from "@/components/dashboard/endpoint-table";
import { PageHeader } from "@/components/dashboard/page-header";

export default function CatalogEndpointsPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-8">
      <Link href={`/dashboard/catalogo/${params.id}`} className="text-sm font-medium text-[#870412] hover:text-[#E1111C]">
        Volver a la API
      </Link>
      <div className="mt-4">
        <PageHeader eyebrow="Catálogo" title="Endpoints" />
      </div>
      <div className="mt-8">
        <EndpointTable apiId={params.id} />
      </div>
    </main>
  );
}
