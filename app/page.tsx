import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col bg-white lg:flex-row">
      <section className="flex flex-col justify-between bg-[#E1111C] px-8 py-10 text-white lg:w-[42%] lg:px-12 lg:py-14">
        <div className="inline-flex w-fit rounded-2xl bg-white px-4 py-3">
          <BrandLogo className="h-8 w-auto sm:h-10" />
        </div>
        <div>
          <h1 className="max-w-sm text-4xl leading-tight font-medium">Panel de administración</h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-white/90">
            Contrataciones, soporte, catálogo y apps del portal, en un solo lugar.
          </p>
        </div>
        <p className="text-sm text-white/80">Uso interno</p>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm />
      </section>
    </main>
  );
}
