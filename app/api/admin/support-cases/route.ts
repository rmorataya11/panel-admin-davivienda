import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { listSupportCases } from "@/lib/db/support-cases";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const cases = await listSupportCases();
    return NextResponse.json(cases);
  } catch (error) {
    console.error(
      "No se pudieron listar los casos de soporte.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "No se pudieron cargar los casos de soporte." },
      { status: 500 },
    );
  }
}
