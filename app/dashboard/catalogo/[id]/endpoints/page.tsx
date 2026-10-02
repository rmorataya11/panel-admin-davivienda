"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EndpointTable } from "@/components/dashboard/endpoint-table";

export default function CatalogEndpointsPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-6">
      <Link href={`/dashboard/catalogo/${params.id}`} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
        Volver a la API
      </Link>
      <h1 className="mt-3 mb-6 text-2xl font-semibold tracking-tight">Endpoints</h1>
      <EndpointTable apiId={params.id} />
    </main>
  );
}
