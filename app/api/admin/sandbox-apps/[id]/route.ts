import { NextResponse } from "next/server";

import { isSandboxAppReviewStatus, SANDBOX_APP_REVIEW_STATUSES } from "@/lib/admin/types";
import { parseUuid, requireAdmin } from "@/lib/api/admin";
import {
  reviewSandboxApp,
  SandboxAppAlreadyReviewedError,
  SandboxAppInvalidStateError,
  SandboxAppNotFoundError,
} from "@/lib/db/sandbox-apps";

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
    const appId = parseUuid(id);

    if (!appId) {
      return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud no es válido." }, { status: 400 });
    }

    const status =
      body && typeof body === "object" && "status" in body && typeof body.status === "string"
        ? body.status.trim()
        : "";

    if (!isSandboxAppReviewStatus(status)) {
      return NextResponse.json(
        { error: `El estado debe ser ${SANDBOX_APP_REVIEW_STATUSES.join(" o ")}.` },
        { status: 400 },
      );
    }

    const rejectionReason =
      body &&
      typeof body === "object" &&
      "rejectionReason" in body &&
      typeof body.rejectionReason === "string"
        ? body.rejectionReason
        : null;

    const updated = await reviewSandboxApp({
      id: appId,
      status,
      reviewedBy: auth.admin.email,
      rejectionReason,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof SandboxAppNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof SandboxAppAlreadyReviewedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof SandboxAppInvalidStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(
      "No se pudo revisar la solicitud de app sandbox.",
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json(
      { error: "No se pudo actualizar la solicitud de app sandbox." },
      { status: 500 },
    );
  }
}
