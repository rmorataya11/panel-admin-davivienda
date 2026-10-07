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
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <header className="flex h-14 items-center justify-between border-b border-[#e4e4e4] bg-white px-4">
        <Link href="/dashboard" className="min-w-0">
          <BrandLogo className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <p className="hidden max-w-56 truncate text-sm text-[#5c5c5c] sm:block">{email}</p>
          <button type="button" onClick={handleSignOut} className="text-sm text-[#870412] hover:underline">
            Salir
          </button>
        </div>
      </header>
      <div className="h-1 bg-[#E1111C]" />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="border-b border-[#e4e4e4] bg-white md:w-52 md:border-r md:border-b-0">
          <nav className="flex gap-0 overflow-x-auto md:flex-col" aria-label="Secciones">
            {links.map((link) => {
              const active = isActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "border-b-2 border-[#E1111C] px-4 py-3 text-sm font-medium whitespace-nowrap text-[#E1111C] md:border-b-0 md:border-l-2"
                      : "border-b-2 border-transparent px-4 py-3 text-sm whitespace-nowrap text-[#2C2C2C] hover:bg-[#f7f7f7] md:border-b-0 md:border-l-2"
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
    </div>
  );
}
