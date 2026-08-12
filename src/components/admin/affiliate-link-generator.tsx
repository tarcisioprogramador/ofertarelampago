"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { generateAffiliateLink, type AffiliateLinkResult } from "@/lib/admin-actions";
import { storeLabel } from "@/lib/utils";
import { Badge } from "./ui";

export function AffiliateLinkGenerator() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AffiliateLinkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!url.trim() || loading) return;
    setLoading(true);
    setResult(null);
    const data = new FormData();
    data.set("url", url.trim());
    try {
      const res = await generateAffiliateLink(data);
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result.output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Entrada */}
      <div>
        <label htmlFor="aff-url" className="mb-1.5 block text-xs font-bold text-ink-600">
          URL do produto
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-300" aria-hidden />
            <input
              id="aff-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.mercadolivre.com.br/... ou amazon.com.br/..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
            />
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={loading || !url.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Wand2 className="size-4" aria-hidden />}
            Gerar link
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">
          Cole a URL de um produto de qualquer loja parceira. O sistema identifica a loja e aplica o tracking de afiliado automaticamente.
        </p>
      </div>

      {/* Resultado */}
      {result && (
        <div className={`rounded-2xl border p-4 transition-all ${result.tracked ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone={result.tracked ? "green" : "amber"}>{storeLabel(result.store)}</Badge>
              <p className="text-xs font-semibold text-ink-600">{result.message}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setUrl(result.input);
                setResult(null);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink-400 transition-colors hover:text-brand-600"
            >
              <RefreshCw className="size-3" aria-hidden /> Limpar
            </button>
          </div>

          <p className="mt-3 break-all rounded-xl border border-ink-100 bg-white p-3 font-mono text-xs leading-relaxed text-ink-800">{result.output}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                copied ? "bg-emerald-500 text-white" : "bg-ink-950 text-white hover:bg-brand-600"
              }`}
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
            {result.tracked && (
              <a
                href={result.output}
                target="_blank"
                rel="noopener nofollow"
                className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-600"
              >
                <ExternalLink className="size-3.5" aria-hidden /> Testar link
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
