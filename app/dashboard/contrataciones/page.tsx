import { ContractingTable } from "@/components/dashboard/contracting-table";

export default function ContractingPage() {
  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de contratación</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Apruebe o rechace las solicitudes enviadas desde el portal.
        </p>
      </div>
      <ContractingTable />
    </main>
  );
}
