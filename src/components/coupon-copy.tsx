"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CouponCopy({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      aria-label={`Copiar cupom ${code}`}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-mono text-sm font-bold transition-all ${
        copied ? "bg-emerald-500 text-white" : "bg-ink-100 text-ink-800 hover:bg-brand-500 hover:text-white"
      }`}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Copiado!" : code}
    </button>
  );
}
