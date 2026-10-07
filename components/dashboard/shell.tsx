"use client";

import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { getFirebaseAuth } from "@/lib/firebase/client";

const links = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/dashboard/contrataciones", label: "Contrataciones" },
  { href: "/dashboard/soporte", label: "Soporte" },
  { href: "/dashboard/catalogo", label: "Catálogo" },
  { href: "/dashboard/apps", label: "Apps" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <aside className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:w-60 md:border-r md:border-b-0">
        <p className="px-4 pt-4 text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Administración
        </p>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-col md:pb-6" aria-label="Secciones">
          {links.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
