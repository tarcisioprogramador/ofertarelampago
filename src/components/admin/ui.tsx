import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-ink-100 bg-white p-6 shadow-card ${className}`}>{children}</div>;
}

export function AdminPageHeader({ title, subtitle, back, action }: { title: string; subtitle?: string; back?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        {back && (
          <Link href={back} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-brand-600">
            <ArrowLeft className="size-3.5" aria-hidden /> Voltar
          </Link>
        )}
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink-950">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-ink-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-400">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export function SubmitButton({ children = "Salvar" }: { children?: React.ReactNode }) {
  return (
    <button type="submit" className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600">
      {children}
    </button>
  );
}

export function DangerButton({ children = "Excluir" }: { children?: React.ReactNode }) {
  return (
    <button type="submit" className="rounded-lg bg-flash-50 px-3 py-1.5 text-xs font-bold text-flash-600 transition-colors hover:bg-flash-100">
      {children}
    </button>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-ink-400">{label}</p>
        {icon}
      </div>
      <p className="font-display mt-2 text-2xl font-extrabold text-ink-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "green" | "red" | "amber" }) {
  const tones = {
    ink: "bg-ink-100 text-ink-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-flash-50 text-flash-600",
    amber: "bg-amber-50 text-amber-700",
  };
  return <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}
