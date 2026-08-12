"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { SearchBar } from "./search-bar";

type Cat = { name: string; slug: string };

export function MobileMenu({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/ofertas-relampago/", label: "⚡ Ofertas Relâmpago" },
    { href: "/ofertas", label: "Ofertas" },
    { href: "/comparar", label: "Comparar" },
    { href: "/cupons", label: "Cupons" },
    { href: "/blog", label: "Blog" },
    { href: "/guias", label: "Guias" },
  ];

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="grid size-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-600"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 top-[64px] z-40 overflow-y-auto bg-white">
          <div className="space-y-4 p-4 pb-16">
            <SearchBar placeholder="Busque um produto..." />
            <nav className="space-y-1" aria-label="Menu principal">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 font-semibold text-ink-800 transition-colors hover:bg-brand-50 hover:text-brand-700">
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => setCatsOpen(!catsOpen)}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 font-semibold text-ink-800 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                Categorias
                <ChevronDown className={`size-4 transition-transform ${catsOpen ? "rotate-180" : ""}`} />
              </button>
              {catsOpen && (
                <div className="ml-4 space-y-1 border-l-2 border-brand-100 pl-3">
                  {categories.map((c) => (
                    <Link key={c.slug} href={`/${c.slug}/`} className="block rounded-lg px-3 py-2.5 text-sm text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700">
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
