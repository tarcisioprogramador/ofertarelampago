"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Correção de dados");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (message.trim().length < 10) return;
    setStatus("loading");
    const res = await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    setStatus(res.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden />
        <div>
          <p className="font-bold text-emerald-800">Mensagem enviada!</p>
          <p className="mt-1 text-sm text-emerald-700">Obrigado pelo contato. Nossa equipe vai responder em até 2 dias úteis.</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-xs font-bold text-ink-600">Seu nome</label>
          <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} placeholder="Nome completo" />
        </div>
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-xs font-bold text-ink-600">Seu e-mail</label>
          <input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} placeholder="voce@email.com" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-subject" className="mb-1.5 block text-xs font-bold text-ink-600">Assunto</label>
        <select id="cf-subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls}>
          <option>Correção de dados</option>
          <option>Sugestão de produto</option>
          <option>Parcerias</option>
          <option>Imprensa</option>
          <option>Outro</option>
        </select>
      </div>
      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-xs font-bold text-ink-600">Mensagem</label>
        <textarea id="cf-message" value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} rows={5} className={inputCls} placeholder="Escreva sua mensagem (mínimo de 10 caracteres)..." />
      </div>
      {status === "error" && <p className="text-xs font-semibold text-flash-600">Não foi possível enviar. Tente novamente em instantes.</p>}
      <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60 sm:w-auto">
        {status === "loading" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {status === "loading" ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
