export function BrandLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <img
      src="/logo/davivienda.png"
      alt="Davivienda"
      width={1024}
      height={136}
      className={className}
    />
  );
}
