import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { listPendingSandboxApps } from "@/lib/db/sandbox-apps";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    return NextResponse.json(await listPendingSandboxApps());
  } catch (error) {
    console.error(
      "No se pudieron listar las solicitudes de apps sandbox.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "No se pudieron cargar las solicitudes de apps sandbox." },
      { status: 500 },
    );
  }
}
