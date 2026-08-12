"use client";

import { useRouter } from "next/navigation";
import { Field, inputCls, SubmitButton } from "./ui";

type Author = { id: string; name: string };
type Category = { id: string; name: string };
type Product = { id: string; name: string; slug: string };

type ArticleFormProps = {
  authors: Author[];
  categories: Category[];
  products: Product[];
  saveAction: (formData: FormData) => Promise<void>;
  initial?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    type: string;
    categoryId: string;
    authorId: string;
    coverImage: string;
    published: boolean;
    publishedAt: string;
    seoTitle: string;
    seoDescription: string;
    productSlugs: string[];
  };
};

export function ArticleForm({ authors, categories, products, saveAction, initial }: ArticleFormProps) {
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const form = e.currentTarget;
    const checks = Array.from(form.querySelectorAll<HTMLInputElement>("input[data-product]")).filter((i) => i.checked);
    for (const c of checks) data.append("productSlugs", c.dataset.product!);
    void saveAction(data);
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título *">
          <input required name="title" defaultValue={initial?.title} className={inputCls} placeholder="Melhores celulares até R$ 1.500" />
        </Field>
        <Field label="Slug (URL)">
          <input name="slug" defaultValue={initial?.slug} className={inputCls} placeholder="melhores-celulares-ate-1500" />
        </Field>
        <Field label="Tipo">
          <select name="type" defaultValue={initial?.type ?? "BLOG"} className={inputCls}>
            <option value="BLOG">Artigo (blog)</option>
            <option value="GUIDE">Guia de compra</option>
            <option value="NEWS">Notícia</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria (blog)">
            <select name="categoryId" defaultValue={initial?.categoryId ?? ""} className={inputCls}>
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Autor">
            <select name="authorId" defaultValue={initial?.authorId ?? ""} className={inputCls}>
              <option value="">Sem autor</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Data de publicação">
          <input type="date" name="publishedAt" defaultValue={initial?.publishedAt ?? ""} className={inputCls} />
        </Field>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 pb-2.5 text-sm font-semibold text-ink-700">
            <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="size-4 accent-brand-500" /> Publicado
          </label>
        </div>
      </div>

      <Field label="Resumo (aparece nos cards)">
        <input name="excerpt" defaultValue={initial?.excerpt} className={inputCls} placeholder="Resumo de 1 a 2 frases..." />
      </Field>

      <div>
        <Field label="Conteúdo (markdown leve)" hint="Suporta # título, ## subtítulo, **negrito**, - listas, [texto](url)">
          <textarea required name="content" defaultValue={initial?.content} rows={14} className={`${inputCls} font-mono text-[13px] leading-relaxed`} />
        </Field>
      </div>

      <div>
        <h3 className="font-display mb-2 text-sm font-bold text-ink-900">Produtos relacionados</h3>
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-ink-100 p-3">
          {products.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-700 transition-colors hover:bg-ink-50">
              <input type="checkbox" data-product={p.slug} defaultChecked={initial?.productSlugs.includes(p.slug)} className="size-4 rounded accent-brand-500" />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="SEO title (opcional)">
          <input name="seoTitle" defaultValue={initial?.seoTitle} className={inputCls} />
        </Field>
        <Field label="SEO description (opcional)">
          <input name="seoDescription" defaultValue={initial?.seoDescription} className={inputCls} />
        </Field>
      </div>

      <div className="flex gap-3">
        <SubmitButton>{initial?.id ? "Salvar alterações" : "Criar artigo"}</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/artigos/")} className="rounded-xl border border-ink-200 px-6 py-2.5 text-sm font-bold text-ink-600 transition-colors hover:bg-ink-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
