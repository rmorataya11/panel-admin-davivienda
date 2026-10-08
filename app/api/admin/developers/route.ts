import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api/admin";
import { listDevelopers } from "@/lib/db/developers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const developers = await listDevelopers();
    return NextResponse.json(developers);
  } catch (error) {
    console.error("No se pudieron listar los desarrolladores.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudieron cargar los usuarios." }, { status: 500 });
  }
}
