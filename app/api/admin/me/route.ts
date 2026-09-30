import { NextResponse } from "next/server";

import { verifyAdmin } from "@/lib/auth/verify-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    return NextResponse.json({ email: admin.email });
  } catch (error) {
    console.error(
      "Error al consultar el administrador.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
