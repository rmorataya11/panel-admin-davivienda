"use client";

import { useParams } from "next/navigation";

import { CatalogForm } from "@/components/dashboard/catalog-form";

export default function EditCatalogApiPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Editar API</h1>
      <CatalogForm apiId={params.id} />
    </main>
  );
}
