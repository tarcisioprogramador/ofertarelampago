"use client";

import { useRouter } from "next/navigation";
import { Field, inputCls, SubmitButton } from "./ui";

type Product = { id: string; name: string; slug: string };

export function ComparisonForm({ products, saveAction }: { products: Product[]; saveAction: (formData: FormData) => Promise<void> }) {
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const checks = Array.from(e.currentTarget.querySelectorAll<HTMLInputElement>("input[data-product]")).filter((i) => i.checked);
    if (checks.length < 2) {
      alert("Selecione pelo menos 2 produtos.");
      return;
    }
    for (const c of checks) data.append("productSlugs", c.dataset.product!);
    void saveAction(data);
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Título *">
        <input required name="title" className={inputCls} placeholder="Galaxy A17 vs Moto G85" />
      </Field>
      <Field label="Slug (URL)">
        <input name="slug" className={inputCls} placeholder="galaxy-a17-vs-moto-g85" />
      </Field>
      <Field label="Introdução">
        <textarea name="intro" rows={3} className={inputCls} placeholder="O duelo dos intermediários de 2026..." />
      </Field>
      <div>
        <h3 className="font-display mb-2 text-xs font-bold text-ink-600">Produtos (2 a 4) *</h3>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-100 p-3">
          {products.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-700 transition-colors hover:bg-ink-50">
              <input type="checkbox" data-product={p.slug} className="size-4 rounded accent-brand-500" />
              {p.name}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="SEO title">
          <input name="seoTitle" className={inputCls} />
        </Field>
        <Field label="SEO description">
          <input name="seoDescription" className={inputCls} />
        </Field>
      </div>
      <div className="flex gap-3">
        <SubmitButton>Criar comparação</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/comparacoes")} className="rounded-xl border border-ink-200 px-6 py-2.5 text-sm font-bold text-ink-600 transition-colors hover:bg-ink-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
