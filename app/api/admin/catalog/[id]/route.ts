import { NextResponse } from "next/server";

import { parseUuid, requireAdmin } from "@/lib/api/admin";
import {
  deleteCatalogApi,
  getCatalogApi,
  isUniqueViolation,
  readCatalogInput,
  updateCatalogApi,
} from "@/lib/db/catalog";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function invalidId() {
  return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const apiId = parseUuid(id);

    if (!apiId) {
      return invalidId();
    }

    const api = await getCatalogApi(apiId);

    if (!api) {
      return NextResponse.json({ error: "No se encontró la API." }, { status: 404 });
    }

    return NextResponse.json(api);
  } catch (error) {
    console.error("No se pudo consultar la API.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo cargar la API." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const apiId = parseUuid(id);

    if (!apiId) {
      return invalidId();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const input = readCatalogInput(body, "update");

    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const updated = await updateCatalogApi(apiId, input.value);

    if (!updated) {
      return NextResponse.json({ error: "No se encontró la API." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Ya existe una API con ese slug." }, { status: 409 });
    }

    console.error("No se pudo actualizar la API.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo actualizar la API." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const apiId = parseUuid(id);

    if (!apiId) {
      return invalidId();
    }

    const deleted = await deleteCatalogApi(apiId);

    if (!deleted) {
      return NextResponse.json({ error: "No se encontró la API." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("No se pudo eliminar la API.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo eliminar la API." }, { status: 500 });
  }
}
