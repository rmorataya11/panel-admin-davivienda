import { NextResponse } from "next/server";

import { parseUuid, requireAdmin } from "@/lib/api/admin";
import { isUniqueViolation } from "@/lib/db/catalog";
import { deleteEndpoint, getEndpoint, readEndpointInput, updateEndpoint } from "@/lib/db/endpoints";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; endpointId: string }>;
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

    const { id, endpointId } = await context.params;
    const apiId = parseUuid(id);
    const parsedEndpointId = parseUuid(endpointId);

    if (!apiId || !parsedEndpointId) {
      return invalidId();
    }

    const endpoint = await getEndpoint(apiId, parsedEndpointId);

    if (!endpoint) {
      return NextResponse.json({ error: "No se encontró el endpoint." }, { status: 404 });
    }

    return NextResponse.json(endpoint);
  } catch (error) {
    console.error("No se pudo consultar el endpoint.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo cargar el endpoint." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id, endpointId } = await context.params;
    const apiId = parseUuid(id);
    const parsedEndpointId = parseUuid(endpointId);

    if (!apiId || !parsedEndpointId) {
      return invalidId();
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const input = readEndpointInput(body, "update");

    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const updated = await updateEndpoint(apiId, parsedEndpointId, input.value);

    if (!updated) {
      return NextResponse.json({ error: "No se encontró el endpoint." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Ya existe un endpoint con ese slug en esta API." }, { status: 409 });
    }

    console.error("No se pudo actualizar el endpoint.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo actualizar el endpoint." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id, endpointId } = await context.params;
    const apiId = parseUuid(id);
    const parsedEndpointId = parseUuid(endpointId);

    if (!apiId || !parsedEndpointId) {
      return invalidId();
    }

    const deleted = await deleteEndpoint(apiId, parsedEndpointId);

    if (!deleted) {
      return NextResponse.json({ error: "No se encontró el endpoint." }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("No se pudo eliminar el endpoint.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo eliminar el endpoint." }, { status: 500 });
  }
}
