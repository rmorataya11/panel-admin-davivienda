import { NextResponse } from "next/server";

import { CONTRACTING_STATUSES, isContractingStatus } from "@/lib/admin/types";
import { parseUuid, readAllowedStatus, requireAdmin } from "@/lib/api/admin";
import { updateContractingRequestStatus } from "@/lib/db/contracting-requests";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const requestId = parseUuid(id);

    if (!requestId) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    const parsed = await readAllowedStatus(request, CONTRACTING_STATUSES);

    if (!parsed.ok) {
      return parsed.response;
    }

    if (!isContractingStatus(parsed.status)) {
      return NextResponse.json({ error: "El estado indicado no es válido." }, { status: 400 });
    }

    const updated = await updateContractingRequestStatus(requestId, parsed.status);

    if (!updated) {
      return NextResponse.json({ error: "No se encontró la solicitud." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "No se pudo actualizar la solicitud de contratación.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud de contratación." },
      { status: 500 },
    );
  }
}
