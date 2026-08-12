"use client";

import { useState } from "react";
import { Check, ClipboardList, Copy, ExternalLink } from "lucide-react";
import { storeLabel } from "@/lib/utils";
import { Badge } from "./ui";

export type AffiliateOfferRow = {
  id: string;
  productName: string;
  productSlug: string;
  store: "mercado-livre" | "amazon" | "magazine-luiza" | null;
  storeName: string;
  price: number;
  url: string; // URL original
  affiliateUrl: string; // URL com tracking
  tracked: boolean;
};

export function AffiliateLinksTable({ offers }: { offers: AffiliateOfferRow[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  async function copyOne(row: AffiliateOfferRow) {
    await copyText(row.affiliateUrl);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function copyAll() {
    const text = offers
      .map((o) => (o.tracked ? o.affiliateUrl : o.url))
      .join("\n");
    await copyText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  const trackedCount = offers.filter((o) => o.tracked).length;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-500">
          <strong className="text-ink-800">{offers.length}</strong> ofertas · <strong className="text-emerald-700">{trackedCount}</strong> com tracking de afiliado
        </p>
        <button
          type="button"
          onClick={copyAll}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
            copiedAll ? "bg-emerald-500 text-white" : "bg-ink-950 text-white hover:bg-brand-600"
          }`}
        >
          {copiedAll ? <Check className="size-3.5" aria-hidden /> : <ClipboardList className="size-3.5" aria-hidden />}
          {copiedAll ? "Todos copiados!" : "Copiar todos"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 font-bold">Produto</th>
              <th className="px-4 py-3 font-bold">Loja</th>
              <th className="px-4 py-3 font-bold">Preço</th>
              <th className="px-4 py-3 font-bold">Link de afiliado</th>
              <th className="px-4 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr key={o.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                <td className="max-w-[220px] px-4 py-3">
                  <p className="truncate font-semibold text-ink-900" title={o.productName}>
                    {o.productName}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-600">{o.storeName}</span>
                    {o.tracked ? <Badge tone="green">afiliado</Badge> : <Badge tone="amber">sem tracking</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-ink-900">
                  {o.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  <p className="truncate font-mono text-[11px] text-ink-500" title={o.affiliateUrl}>
                    {o.affiliateUrl}
                  </p>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <a
                      href={o.affiliateUrl}
                      target="_blank"
                      rel="noopener nofollow"
                      className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-[11px] font-bold text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600"
                      aria-label={`Abrir link de ${o.productName}`}
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                    <button
                      type="button"
                      onClick={() => copyOne(o)}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
                        copiedId === o.id ? "bg-emerald-500 text-white" : "bg-ink-950 text-white hover:bg-brand-600"
                      }`}
                    >
                      {copiedId === o.id ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
