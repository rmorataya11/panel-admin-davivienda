import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type Credential,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function readServiceAccount(value: string): Credential | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as ServiceAccount;
    if (!parsed.private_key || !parsed.client_email) {
      return null;
    }

    return cert(parsed);
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
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
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
