import Link from "next/link";
import { ChevronDown, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const categories = await prisma.category.findMany({
    where: { products: { some: {} } },
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });

  const nav = [
    { href: "/ofertas-relampago/", label: "Relâmpago", icon: true },
    { href: "/ofertas", label: "Ofertas" },
    { href: "/comparar", label: "Comparar" },
    { href: "/cupons", label: "Cupons" },
    { href: "/blog", label: "Blog" },
    { href: "/guias", label: "Guias" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-8">
        <Logo />

        {/* Navegação desktop */}
        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {/* Mega menu categorias */}
          <div className="group relative">
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 hover:text-brand-600">
              Categorias
              <ChevronDown className="size-3.5 text-ink-400 transition-transform group-hover:rotate-180" aria-hidden />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-[560px] translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid grid-cols-3 gap-1 rounded-2xl border border-ink-100 bg-white p-3 shadow-card-hover">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}/`}
                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    {c.name}
                  </Link>
                ))}
                <Link href="/busca/" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50">
                  Ver todos os produtos →
                </Link>
              </div>
            </div>
          </div>

          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-50 hover:text-brand-600"
            >
              {item.icon && <Zap className="size-3.5 fill-brand-500 text-brand-500" aria-hidden />}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden md:block">
          <SearchBar placeholder="Buscar produto..." />
        </div>

        <div className="ml-auto md:ml-0">
          <MobileMenu categories={categories} />
        </div>
      </div>
    </header>
  );
}
