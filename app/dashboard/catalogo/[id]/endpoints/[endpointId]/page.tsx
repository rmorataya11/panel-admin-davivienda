"use client";

import { useParams } from "next/navigation";

import { EndpointForm } from "@/components/dashboard/endpoint-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function EditEndpointPage() {
  const params = useParams<{ id: string; endpointId: string }>();

  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Endpoints" title="Editar endpoint" />
      <div className="mt-8">
        <EndpointForm apiId={params.id} endpointId={params.endpointId} />
      </div>
    </main>
  );
}
