import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type Credential,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

type GoogleServiceAccountJson = ServiceAccount & {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

function readServiceAccount(value: string): Credential | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as GoogleServiceAccountJson;
    const privateKey = parsed.privateKey ?? parsed.private_key;
    const clientEmail = parsed.clientEmail ?? parsed.client_email;
    if (!privateKey || !clientEmail) {
      return null;
    }

    return cert({
      projectId: parsed.projectId ?? parsed.project_id,
      clientEmail,
      privateKey,
    });
  } catch {
    return null;
  }
}

function credentialFromEnv(): Credential {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (rawJson) {
    const credential = readServiceAccount(rawJson);
    if (credential) {
      return credential;
    }
  }

  const encoded = process.env.GOOGLE_CREDENTIALS_BASE64?.trim();
  if (encoded) {
    const decoded = encoded.startsWith("{") ? encoded : Buffer.from(encoded, "base64").toString("utf8");
    const credential = readServiceAccount(decoded);
    if (credential) {
      return credential;
    }
  }

  return applicationDefault();
}

export function getAdminAuth(): Auth {
  if (!getApps().length) {
    initializeApp({
      credential: credentialFromEnv(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return getAuth();
}
