"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      setReady(true);
    });

    return unsubscribe;
  }, [router]);

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-zinc-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        Panel de administración — próximamente
      </h1>
    </main>
  );
}
