"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows, Plus, X } from "lucide-react";
import { formatBRL } from "@/lib/utils";

export type CompareOption = {
  slug: string;
  name: string;
  brandName: string;
  categoryName: string;
  price: number | null;
};

export function CompareBuilder({ products }: { products: CompareOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [cat, setCat] = useState("");

  const byCategory = useMemo(() => {
    const map = new Map<string, CompareOption[]>();
    for (const p of products) {
      const list = map.get(p.categoryName) ?? [];
      list.push(p);
      map.set(p.categoryName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const filtered = byCategory.filter(([name]) => !cat || name === cat);
  const picked = selected.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean) as CompareOption[];

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return prev;
      return [...prev, slug];
    });
  }

  function compare() {
    if (selected.length < 2) return;
    router.push(`/comparar/?${selected.map((s) => `p=${s}`).join("&")}`);
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-950">
          <GitCompareArrows className="size-5 text-brand-600" aria-hidden />
          Monte sua comparação
        </h2>
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <span className={`font-bold ${picked.length >= 2 ? "text-emerald-600" : "text-ink-500"}`}>{picked.length}/4</span> selecionados
        </div>
      </div>

      {/* Selecionados */}
      <div className="mt-4 flex flex-wrap gap-2">
        {picked.map((p) => (
          <span key={p.slug} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
            {p.brandName} {p.name}
            <button onClick={() => toggle(p.slug)} aria-label={`Remover ${p.name}`} className="text-brand-500 transition-colors hover:text-flash-600">
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        {picked.length === 0 && <span className="text-sm text-ink-400">Selecione 2 a 4 produtos abaixo para comparar preço e ficha técnica.</span>}
      </div>

      <button
        onClick={compare}
        disabled={selected.length < 2}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <GitCompareArrows className="size-4" aria-hidden />
        Comparar {picked.length >= 2 ? `${picked.length} produtos` : "produtos selecionados"}
      </button>

      {/* Filtro por categoria */}
      <div className="mt-6">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-ink-500">Filtrar por categoria</label>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-800 outline-none focus:border-brand-500">
          <option value="">Todas as categorias</option>
          {byCategory.map(([name]) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Lista de produtos */}
      <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto pr-1">
        {filtered.map(([name, list]) => (
          <div key={name}>
            <p className="sticky top-0 z-10 bg-white px-1 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-400">{name}</p>
            {list.map((p) => {
              const active = selected.includes(p.slug);
              return (
                <label key={p.slug} className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${active ? "bg-brand-50" : "hover:bg-ink-50"}`}>
                  <input type="checkbox" checked={active} onChange={() => toggle(p.slug)} disabled={!active && selected.length >= 4} className="size-4 rounded accent-brand-500" />
                  <span className="flex-1 font-semibold text-ink-800">{p.brandName} {p.name}</span>
                  {p.price && <span className="text-xs font-bold text-ink-500">{formatBRL(p.price, 0)}</span>}
                  {!active && selected.length >= 4 && <Plus className="hidden" aria-hidden />}
                </label>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
