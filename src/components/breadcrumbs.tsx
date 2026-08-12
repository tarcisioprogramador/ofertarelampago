import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-ink-500">
        <li>
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-brand-600">
            <Home className="size-3.5" aria-hidden />
            Início
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.href + i} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5 text-ink-300" aria-hidden />
            {i === items.length - 1 ? (
              <span className="font-semibold text-ink-800" aria-current="page">
                {item.name}
              </span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-brand-600">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
