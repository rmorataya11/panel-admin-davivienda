import { NextResponse } from "next/server";

import { parseUuid, requireAdmin } from "@/lib/api/admin";
import { getDeveloperDetail, updateDeveloper } from "@/lib/db/developers";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const developerId = parseUuid(id);

    if (!developerId) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    const detail = await getDeveloperDetail(developerId);

    if (!detail) {
      return NextResponse.json({ error: "No se encontró el usuario." }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("No se pudo obtener el desarrollador.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo cargar el usuario." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const developerId = parseUuid(id);

    if (!developerId) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const payload = body as {
      portalDisabled?: unknown;
      revokeSandbox?: unknown;
      adminNotes?: unknown;
    };

    const patch: {
      portalDisabled?: boolean;
      revokeSandbox?: boolean;
      adminNotes?: string | null;
    } = {};

    if ("portalDisabled" in payload) {
      if (typeof payload.portalDisabled !== "boolean") {
        return NextResponse.json({ error: "portalDisabled debe ser booleano." }, { status: 400 });
      }
      patch.portalDisabled = payload.portalDisabled;
    }

    if ("revokeSandbox" in payload) {
      if (payload.revokeSandbox !== true) {
        return NextResponse.json({ error: "revokeSandbox solo acepta true." }, { status: 400 });
      }
      patch.revokeSandbox = true;
    }

    if ("adminNotes" in payload) {
      if (payload.adminNotes !== null && typeof payload.adminNotes !== "string") {
        return NextResponse.json({ error: "adminNotes debe ser texto." }, { status: 400 });
      }
      patch.adminNotes = payload.adminNotes === null ? null : payload.adminNotes.trim();
    }

    if (
      patch.portalDisabled === undefined &&
      patch.revokeSandbox === undefined &&
      patch.adminNotes === undefined
    ) {
      return NextResponse.json({ error: "Indique al menos un campo a actualizar." }, { status: 400 });
    }

    const updated = await updateDeveloper(developerId, patch);

    if (!updated) {
      return NextResponse.json({ error: "No se encontró el usuario." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("No se pudo actualizar el desarrollador.", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "No se pudo actualizar el usuario." }, { status: 500 });
  }
}
