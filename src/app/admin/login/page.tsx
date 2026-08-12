import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Login · Painel admin", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-card-hover">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-flash-500 text-white">
          <ShieldCheck className="size-6" aria-hidden />
        </span>
        <h1 className="font-display mt-4 text-xl font-extrabold text-ink-950">Painel administrativo</h1>
        <p className="mt-1 text-sm text-ink-500">Acesso restrito à equipe do Oferta Relâmpago.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-ink-400">A senha está definida na variável de ambiente ADMIN_PASSWORD.</p>
    </div>
  );
}
