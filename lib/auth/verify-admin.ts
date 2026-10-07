import { createRemoteJWKSet, errors, jwtVerify } from "jose";

export type VerifiedAdmin = {
  email: string;
  uid: string;
};

export type AdminAuthFailure = {
  ok: false;
  status: 401 | 403;
  error: string;
};

export type VerifyAdminResult = ({ ok: true } & VerifiedAdmin) | AdminAuthFailure;

const UNAUTHENTICATED = "No autenticado";
const FORBIDDEN = "No tiene permisos de administrador";

function normalizeEmail(email: string): string {
  return email.replace(/\s+/g, "").toLowerCase();
}

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

function isTokenError(error: unknown): boolean {
  return error instanceof errors.JOSEError;
}

export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const token = readBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: UNAUTHENTICATED };
  }

  let uid = "";
  let email = "";

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID no está definida.");
    }

    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    uid = typeof payload.sub === "string" ? payload.sub : "";
    email = typeof payload.email === "string" ? normalizeEmail(payload.email) : "";
    if (!uid) {
      return { ok: false, status: 401, error: UNAUTHENTICATED };
    }
  } catch (error) {
    if (isTokenError(error)) {
      return { ok: false, status: 401, error: UNAUTHENTICATED };
    }

    throw error;
  }

  if (!email || !allowedEmails().has(email)) {
    return { ok: false, status: 403, error: FORBIDDEN };
  }

  return { ok: true, email, uid };
}
