import { NextResponse } from "next/server";

import { isSupportCaseStatus, SUPPORT_CASE_STATUSES } from "@/lib/admin/types";
import { parseUuid, readAllowedStatus, requireAdmin } from "@/lib/api/admin";
import { updateSupportCaseStatus } from "@/lib/db/support-cases";

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
    const caseId = parseUuid(id);

    if (!caseId) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    const parsed = await readAllowedStatus(request, SUPPORT_CASE_STATUSES);

    if (!parsed.ok) {
      return parsed.response;
    }

    if (!isSupportCaseStatus(parsed.status)) {
      return NextResponse.json({ error: "El estado indicado no es válido." }, { status: 400 });
    }

    const updated = await updateSupportCaseStatus(caseId, parsed.status);

    if (!updated) {
      return NextResponse.json({ error: "No se encontró el caso." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error(
      "No se pudo actualizar el caso de soporte.",
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: "No se pudo actualizar el caso de soporte." },
      { status: 500 },
    );
  }
}
