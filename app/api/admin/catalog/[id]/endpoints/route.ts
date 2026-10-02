import { NextResponse } from "next/server";

import { parseUuid, requireAdmin } from "@/lib/api/admin";
import { isUniqueViolation } from "@/lib/db/catalog";
import { catalogApiExists, createEndpoint, listEndpoints, readEndpointInput } from "@/lib/db/endpoints";

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

    if (!(await catalogApiExists(apiId))) {
      return NextResponse.json({ error: "No se encontró la API." }, { status: 404 });
    }

    return NextResponse.json(await listEndpoints(apiId));
  } catch (error) {
    console.error("No se pudieron consultar los endpoints.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudieron cargar los endpoints." }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
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

    if (!(await catalogApiExists(apiId))) {
      return NextResponse.json({ error: "No se encontró la API." }, { status: 404 });
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const input = readEndpointInput(body, "create");

    if (!input.ok) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const created = await createEndpoint(apiId, input.value);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Ya existe un endpoint con ese slug en esta API." }, { status: 409 });
    }

    console.error("No se pudo crear el endpoint.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo crear el endpoint." }, { status: 500 });
  }
}
