"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { Search } from "lucide-react";

const POPULAR = ["Galaxy A17", "notebook até 3000", "TV 55", "fone bluetooth", "PS5"];

export function SearchBar({ placeholder = "Busque celular, TV, notebook, geladeira, smartwatch...", large = false, autoFocus = false }: { placeholder?: string; large?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/busca/?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className={`relative w-full ${large ? "max-w-2xl" : "max-w-xl"}`}>
      <form onSubmit={submit} role="search" className="group relative">
        <label htmlFor={large ? "search-hero" : "search-header"} className="sr-only">
          Buscar produto
        </label>
        <Search className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 transition-colors group-focus-within:text-brand-500 ${large ? "size-5" : "size-4"}`} aria-hidden />
        <input
          ref={inputRef}
          id={large ? "search-hero" : "search-header"}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full rounded-full border border-ink-200 bg-white text-ink-900 shadow-card outline-none transition-all placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 ${
            large ? "py-4 pl-12 pr-28 text-base" : "py-2.5 pl-10 pr-24 text-sm"
          }`}
        />
        <button
          type="submit"
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-brand-500 font-semibold text-white transition-all hover:bg-brand-600 focus-visible:ring-4 focus-visible:ring-brand-500/30 ${
            large ? "right-2 px-5 py-2.5 text-sm" : "right-1.5 px-4 py-1.5 text-xs"
          }`}
        >
          Encontrar ofertas
        </button>
      </form>
      {large && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <span className="font-semibold uppercase tracking-wide text-ink-400">Populares:</span>
          {POPULAR.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setValue(term);
                router.push(`/busca/?q=${encodeURIComponent(term)}`);
              }}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600"
            >
              {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
