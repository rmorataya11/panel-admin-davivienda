"use client";

import { useParams } from "next/navigation";

import { EndpointForm } from "@/components/dashboard/endpoint-form";

export default function NewEndpointPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Nuevo endpoint</h1>
      <EndpointForm apiId={params.id} />
    </main>
  );
}
