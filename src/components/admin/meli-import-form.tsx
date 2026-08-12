"use client";

import { useState } from "react";
import { Download, Loader2, PackagePlus } from "lucide-react";
import { importMeliProducts, type ImportResult } from "@/lib/admin-actions";
import { Badge, Field, inputCls } from "./ui";

export function MeliImportForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [links, setLinks] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit() {
    if (!links.trim() || !categoryId || loading) return;
    setLoading(true);
    setResult(null);
    const data = new FormData();
    data.set("categoryId", categoryId);
    data.set("links", links);
    try {
      const res = await importMeliProducts(data);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Categoria dos produtos *">
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>

      <div>
        <label htmlFor="meli-links" className="mb-1.5 block text-xs font-bold text-ink-600">
          Links de afiliado do Mercado Livre (um por linha)
        </label>
        <textarea
          id="meli-links"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          rows={8}
          placeholder={"https://meli.la/2JrJehi\nhttps://meli.la/xxxxxxx"}
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 font-mono text-xs text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
        <p className="mt-1.5 text-[11px] text-ink-400">
          Gere os links no painel de afiliados do ML (<span className="font-mono">mercadolivre.com.br/l/afiliados-home</span>) e cole aqui. O sistema extrai nome, preço e imagem automaticamente, cadastra o produto e vincula seu link de afiliado.
        </p>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || !links.trim() || !categoryId}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PackagePlus className="size-4" aria-hidden />}
        {loading ? "Importando..." : "Importar produtos"}
      </button>

      {result && (
        <div className="rounded-2xl border border-ink-100 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
            <p className="text-sm font-bold text-ink-900">
              {result.imported} importados · {result.skipped} já existiam · {result.failed} com erro
            </p>
            {result.imported > 0 && (
              <a
                href="/admin/produtos/"
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
              >
                <Download className="size-3.5" aria-hidden /> Ver produtos
              </a>
            )}
          </div>
          <ul className="max-h-80 divide-y divide-ink-50 overflow-y-auto">
            {result.items.map((item, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-ink-800">{item.name}</p>
                  {item.message && <p className="truncate text-[11px] text-brand-600">{item.message}</p>}
                </div>
                <Badge tone={item.status === "importado" ? "green" : item.status === "ja-existia" ? "amber" : "red"}>
                  {item.status === "importado" ? "importado" : item.status === "ja-existia" ? "já existia" : "erro"}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
