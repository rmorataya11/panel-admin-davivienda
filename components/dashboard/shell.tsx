"use client";

import { onAuthStateChanged, signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
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
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user) {
        router.replace("/");
        return;
      }

      setEmail(user.email ?? "");
      setReady(true);
    });

    return unsubscribe;
  }, [router]);

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    router.replace("/");
  }

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-[#2C2C2C]/60">Cargando…</p>
      </main>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white md:flex-row">
      <aside className="flex flex-col border-b border-[#2C2C2C]/10 bg-white md:w-64 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-5 md:pt-6 md:pb-0">
          <Link href="/dashboard" className="min-w-0">
            <BrandLogo className="h-7 w-auto max-w-full" />
            <p className="mt-2 text-sm font-medium text-[#2C2C2C]">Administración</p>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-medium text-[#870412] hover:text-[#E1111C] md:hidden"
          >
            Salir
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-3 md:flex-1 md:flex-col md:px-3 md:py-6" aria-label="Secciones">
          {links.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-full bg-[#E1111C] px-4 py-2.5 text-sm font-medium whitespace-nowrap text-white"
                    : "rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap text-[#2C2C2C] hover:bg-[#2C2C2C]/5"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-[#2C2C2C]/10 px-4 py-4 md:block">
          <p className="truncate text-xs text-[#2C2C2C]/60">{email}</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 text-sm font-medium text-[#870412] hover:text-[#E1111C]"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
