import { NextResponse } from "next/server";

import { createCatalogApi, isUniqueViolation, listCatalogApis, readCatalogInput } from "@/lib/db/catalog";
import { requireAdmin } from "@/lib/api/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    return NextResponse.json(await listCatalogApis());
  } catch (error) {
    console.error("No se pudo listar el catálogo.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo cargar el catálogo." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const input = readCatalogInput(body, "create");

    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const created = await createCatalogApi(input.value);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Ya existe una API con ese slug." }, { status: 409 });
    }

    console.error("No se pudo crear la API.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo crear la API." }, { status: 500 });
  }
}
