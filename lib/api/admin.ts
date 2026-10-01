import { NextResponse } from "next/server";

import { verifyAdmin, type VerifiedAdmin } from "@/lib/auth/verify-admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requireAdmin(
  request: Request,
): Promise<{ ok: true; admin: VerifiedAdmin } | { ok: false; response: NextResponse }> {
  const admin = await verifyAdmin(request);

  if (!admin.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: admin.error }, { status: admin.status }),
    };
  }

  return { ok: true, admin };
}

export function parseUuid(value: string) {
  return UUID_PATTERN.test(value) ? value : null;
}

export async function readAllowedStatus(request: Request, allowed: readonly string[]) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "El cuerpo de la solicitud no es válido." },
        { status: 400 },
      ),
    };
  }

  const status =
    body && typeof body === "object" && "status" in body && typeof body.status === "string"
      ? body.status.trim()
      : "";

  if (!allowed.includes(status)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: `El estado debe ser ${allowed.join(", ")}.` },
        { status: 400 },
      ),
    };
  }

  return { ok: true as const, status };
}
