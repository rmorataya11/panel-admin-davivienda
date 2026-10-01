import { getIdToken } from "@/lib/firebase/client";

export async function adminFetch(path: string, init: RequestInit = {}) {
  const token = await getIdToken();

  if (!token) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(path, { ...init, headers });
}
