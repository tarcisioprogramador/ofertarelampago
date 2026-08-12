"use client";

import { FormEvent, useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

export function AlertPriceForm({ productId, productName, currentPrice }: { productId: string; productName: string; currentPrice: number }) {
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [contactType, setContactType] = useState<"email" | "whatsapp">("email");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const desired = Number(price.replace(",", "."));
    if (!desired || desired <= 0) {
      setStatus("error");
      setError("Informe um preço desejado válido.");
      return;
    }
    if (!contact.trim()) {
      setStatus("error");
      setError("Informe seu e-mail ou WhatsApp para receber o aviso.");
      return;
    }
    setStatus("loading");
    setError("");

    const res = await fetch("/api/price-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        desiredPrice: desired,
        [contactType]: contact.trim(),
      }),
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Não foi possível criar o alerta. Tente novamente.");
    }
  }

  if (status === "success") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
        <div>
          <p className="font-semibold text-emerald-800">Alerta criado com sucesso!</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Vamos te avisar quando o <strong>{productName}</strong> atingir o preço desejado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="flex items-center gap-2">
        <BellRing className="size-4 text-brand-600" aria-hidden />
        <p className="text-sm font-semibold text-ink-800">
          Quero ser avisado quando o <strong>{productName}</strong> chegar a:
        </p>
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">R$</span>
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder={String(Math.round(currentPrice * 0.75)).replace(".", ",")}
          aria-label="Preço desejado"
          className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-ink-900 outline-none transition-all placeholder:font-normal placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setContactType("email")}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            contactType === "email" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-500 hover:border-ink-300"
          }`}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => setContactType("whatsapp")}
          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            contactType === "whatsapp" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink-200 bg-white text-ink-500 hover:border-ink-300"
          }`}
        >
          WhatsApp
        </button>
      </div>

      <input
        type={contactType === "email" ? "email" : "tel"}
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder={contactType === "email" ? "seu@email.com" : "(11) 99999-9999"}
        aria-label={contactType === "email" ? "Seu e-mail" : "Seu WhatsApp"}
        className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
      />

      {status === "error" && <p className="text-xs font-semibold text-flash-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-brand-600 disabled:opacity-60"
      >
        {status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
        {status === "loading" ? "Criando alerta..." : "Criar alerta de preço"}
      </button>
      <p className="text-[11px] leading-relaxed text-ink-400">Sem spam. Você decide quando receber nossos avisos e pode cancelar quando quiser.</p>
    </form>
  );
}
