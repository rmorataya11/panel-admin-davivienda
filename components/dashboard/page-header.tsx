export function PageHeader({
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-[#e4e4e4] pb-4">
      <h1 className="text-xl font-medium text-[#2C2C2C]">{title}</h1>
      {description ? <p className="mt-1 max-w-3xl text-sm text-[#5c5c5c]">{description}</p> : null}
    </header>
  );
}
