import { getAdminAuth } from "@/lib/firebase/admin";

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

function isFirebaseAuthError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code.startsWith("auth/")
  );
}

export async function verifyAdmin(request: Request): Promise<VerifyAdminResult> {
  const token = readBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: UNAUTHENTICATED };
  }

  let uid = "";
  let email = "";

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    uid = decoded.uid;
    email = typeof decoded.email === "string" ? normalizeEmail(decoded.email) : "";
  } catch (error) {
    if (isFirebaseAuthError(error)) {
      return { ok: false, status: 401, error: UNAUTHENTICATED };
    }

    throw error;
  }

  if (!email || !allowedEmails().has(email)) {
    return { ok: false, status: 403, error: FORBIDDEN };
  }

  return { ok: true, email, uid };
}
