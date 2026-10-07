"use client";

import { useParams } from "next/navigation";

import { EndpointForm } from "@/components/dashboard/endpoint-form";
import { PageHeader } from "@/components/dashboard/page-header";

export default function NewEndpointPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader eyebrow="Endpoints" title="Nuevo endpoint" description="El método, la ruta y el cuerpo se comparten. La descripción cambia por idioma." />
      <div className="mt-8">
        <EndpointForm apiId={params.id} />
      </div>
    </main>
  );
}
