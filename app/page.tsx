import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-white">
      <header className="flex h-16 items-center border-b border-[#e4e4e4] px-6">
        <BrandLogo className="h-8 w-auto" />
        <span className="ml-4 border-l border-[#e4e4e4] pl-4 text-sm text-[#2C2C2C]">Administración</span>
      </header>
      <div className="h-1 bg-[#E1111C]" />
      <section className="flex flex-1 items-start justify-center px-6 py-16">
        <LoginForm />
      </section>
    </main>
  );
}
