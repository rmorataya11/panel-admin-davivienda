import { AppsTable } from "@/components/dashboard/apps-table";

export default function AppsPage() {
  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Apps</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Aplicaciones de los desarrolladores. El ambiente pasa a producción al aprobar la contratación vinculada, y el
          estado queda revocado al rechazarla.
        </p>
      </div>
      <AppsTable />
    </main>
  );
}
