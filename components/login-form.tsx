"use client";

import { FirebaseError } from "firebase/app";
import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { fieldClass, primaryButtonClass } from "@/components/dashboard/styles";
import { getFirebaseAuth } from "@/lib/firebase/client";

function loginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "Correo o contraseña incorrectos.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Espere un momento e intente de nuevo.";
      case "auth/user-disabled":
        return "Esta cuenta está deshabilitada.";
      case "auth/network-request-failed":
        return "No hay conexión. Revise su red e intente de nuevo.";
      default:
        return "No se pudo iniciar sesión. Intente de nuevo.";
    }
  }

  return "No se pudo iniciar sesión. Intente de nuevo.";
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !password) {
      setError("Ingrese correo y contraseña.");
      return;
    }

    setError("");
    setPending(true);

    try {
      const auth = getFirebaseAuth();
      await setPersistence(auth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await credential.user.getIdToken();
      router.push("/dashboard");
    } catch (submitError) {
      setError(loginErrorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm">
      <h1 className="text-xl font-medium text-[#2C2C2C]">Ingreso</h1>
      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#2C2C2C]" htmlFor="email">
          Correo
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#2C2C2C]" htmlFor="password">
          Contraseña
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
            className={fieldClass}
          />
        </label>
        {error ? (
          <p role="alert" className="border border-[#870412] bg-white px-3 py-2 text-sm text-[#870412]">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </form>
  );
}
