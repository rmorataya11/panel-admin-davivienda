import { SupportTable } from "@/components/dashboard/support-table";

export default function SupportPage() {
  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Casos de soporte</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Revise los casos abiertos y márquelos como resueltos.
        </p>
      </div>
      <SupportTable />
    </main>
  );
}
