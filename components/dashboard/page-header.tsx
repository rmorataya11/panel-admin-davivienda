export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header>
      <p className="text-xs font-medium tracking-[0.18em] text-[#E1111C] uppercase">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-medium text-[#2C2C2C]">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-[#2C2C2C]/70">{description}</p> : null}
    </header>
  );
}
