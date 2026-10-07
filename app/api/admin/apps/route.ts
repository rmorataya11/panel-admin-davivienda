import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { listApps } from "@/lib/db/apps";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    return NextResponse.json(await listApps());
  } catch (error) {
    console.error("No se pudieron listar las apps.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudieron cargar las apps." }, { status: 500 });
  }
}
