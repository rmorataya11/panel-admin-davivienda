import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { listContractingRequests } from "@/lib/db/contracting-requests";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const requests = await listContractingRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error(
      "No se pudieron listar las solicitudes de contratación.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "No se pudieron cargar las solicitudes de contratación." },
      { status: 500 },
    );
  }
}
