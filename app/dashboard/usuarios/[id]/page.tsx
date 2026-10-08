"use client";

import { useParams } from "next/navigation";

import { DeveloperDetail } from "@/components/dashboard/developer-detail";
import { PageHeader } from "@/components/dashboard/page-header";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="px-4 py-8 sm:px-8">
      <PageHeader title="Detalle del usuario" />
      <div className="mt-8">
        <DeveloperDetail developerId={params.id} />
      </div>
    </main>
  );
}
