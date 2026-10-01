import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Panel de administración</h1>
      <p className="max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        Revise las solicitudes de contratación y los casos de soporte que llegan desde el portal.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/contrataciones"
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Contrataciones
        </Link>
        <Link
          href="/dashboard/soporte"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
        >
          Soporte
        </Link>
      </div>
    </main>
  );
}
