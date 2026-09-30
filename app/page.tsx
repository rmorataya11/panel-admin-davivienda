import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight">
        Panel de Administración — Davivienda
      </h1>
      <LoginForm />
    </main>
  );
}
