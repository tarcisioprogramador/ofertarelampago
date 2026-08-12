import Link from "next/link";
import Image from "next/image";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Oferta Relâmpago — início">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm transition-transform duration-300 group-hover:scale-105">
        <Image src="/images/logo.svg" alt="" width={36} height={36} className="size-9" priority />
      </span>
      <span className="leading-tight">
        <span className={`font-display block text-[17px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink-950"}`}>
          Oferta<span className="text-brand-500">Relâmpago</span>
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-ink-300" : "text-ink-400"}`}>
          Compre melhor
        </span>
      </span>
    </Link>
  );
}
