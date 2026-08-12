"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ChevronDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { PRICE_BUCKETS } from "@/lib/search";

type AttrOption = { key: string; name: string; type: string; values: string[] };
type BrandOption = { slug: string; name: string; count: number };

export function FilterPanel({ brands, attributes, categoryPath }: { brands: BrandOption[]; attributes: AttrOption[]; categoryPath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const setParam = useCallback(
    (key: string, value: string, checked: boolean) => {
      const next = new URLSearchParams(params);
      const current = next.getAll(key);
      const set = new Set(current);
      if (checked) set.add(value);
      else set.delete(value);
      next.delete(key);
      [...set].forEach((v) => next.append(key, v));
      next.delete("pagina");
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [params, pathname, router]
  );

  const clearAll = () => {
    router.replace(categoryPath, { scroll: false });
  };

  const activeCount = useMemo(() => {
    let n = 0;
    for (const [k, v] of params.entries()) {
      if (["marca", "preco", "pagina", "q", "ordenar"].includes(k)) continue;
      n += v.split(",").filter(Boolean).length;
    }
    return n + (params.get("marca") ? 1 : 0) + (params.get("preco") ? 1 : 0);
  }, [params]);

  const selectedPrice = params.get("preco");

  function PriceGroup() {
    return (
      <fieldset>
        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">Preço</legend>
        <div className="space-y-1.5">
          {PRICE_BUCKETS.map((b) => {
            const id = `${b.min}-${b.max}`;
            const checked = selectedPrice === id;
            return (
              <label key={id} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 transition-colors hover:text-brand-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setParam("preco", id, e.target.checked)}
                  className="size-4 rounded border-ink-300 accent-brand-500"
                />
                {b.label}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  function BrandGroup() {
    if (!brands.length) return null;
    return (
      <fieldset>
        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">Marca</legend>
        <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {brands.map((b) => {
            const checked = params.getAll("marca").includes(b.slug);
            return (
              <label key={b.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 transition-colors hover:text-brand-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setParam("marca", b.slug, e.target.checked)}
                  className="size-4 rounded border-ink-300 accent-brand-500"
                />
                <span className="flex-1">{b.name}</span>
                <span className="text-xs text-ink-400">{b.count}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  function AttrGroup({ attr }: { attr: AttrOption }) {
    const selected = params.getAll(attr.key);
    return (
      <fieldset>
        <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-500">{attr.name}</legend>
        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {attr.values.map((value) => {
            const checked = selected.includes(value);
            return (
              <label key={value} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 transition-colors hover:text-brand-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setParam(attr.key, value, e.target.checked)}
                  className="size-4 rounded border-ink-300 accent-brand-500"
                />
                {value}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <aside className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink-950">
          <SlidersHorizontal className="size-4 text-brand-600" aria-hidden />
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">{activeCount}</span>
          )}
        </h2>
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs font-semibold text-ink-500 transition-colors hover:text-flash-600">
            <RotateCcw className="size-3" aria-hidden />
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-5">
        <details open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
            Preço
            <ChevronDown className="size-4 text-ink-400" aria-hidden />
          </summary>
          <div className="mt-3">
            <PriceGroup />
          </div>
        </details>

        <details open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
            Marca
            <ChevronDown className="size-4 text-ink-400" aria-hidden />
          </summary>
          <div className="mt-3">
            <BrandGroup />
          </div>
        </details>

        {attributes.map((attr) => (
          <details key={attr.key} open={attr.values.length <= 5}>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
              {attr.name}
              <ChevronDown className="size-4 text-ink-400" aria-hidden />
            </summary>
            <div className="mt-3">
              <AttrGroup attr={attr} />
            </div>
          </details>
        ))}
      </div>
    </aside>
  );
}
