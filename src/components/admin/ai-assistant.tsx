"use client";

import { useState, useTransition } from "react";
import { Bot, Loader2, Sparkles, Link2, Image as ImageIcon, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Field, inputCls } from "./ui";
import { generateProductDraft, createProductFromDraft, type AiDraftResult } from "@/lib/admin-actions";

type CategoryOpt = { id: string; name: string };
type BrandOpt = { id: string; name: string };

export function AiAssistant({ categories, brands }: { categories: CategoryOpt[]; brands: BrandOpt[] }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [brandId, setBrandId] = useState("");
  const [result, setResult] = useState<AiDraftResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  function generate() {
    const fd = new FormData();
    fd.set("link", link);
    fd.set("description", description);
    fd.set("photos", photos);
    fd.set("categoryId", categoryId);
    setResult(null);
    setCreateError("");
    startTransition(async () => {
      const res = await generateProductDraft(fd);
      setResult(res);
    });
  }

  function createProduct() {
    if (!result || !result.ok) return;
    if (!brandId) {
      setCreateError("Selecione a marca antes de publicar.");
      return;
    }
    setCreating(true);
    setCreateError("");
    const d = result.draft;
    const fd = new FormData();
    fd.set("name", d.name);
    fd.set("slug", d.slug);
    fd.set("brandId", brandId);
    fd.set("categoryId", categoryId);
    fd.set("summary", d.summary);
    fd.set("description", d.description);
    fd.set("imageUrl", d.imageUrl);
    fd.set("galleryImages", d.galleryImages.join("\n"));
    fd.set("rating", String(d.rating));
    fd.set("reviewCount", String(d.reviewCount));
    fd.set("featured", "on");
    fd.set("isNew", "on");
    fd.set("tags", d.tags.join(", "));
    fd.set("pros", d.pros.join("\n"));
    fd.set("cons", d.cons.join("\n"));
    for (const [k, v] of Object.entries(d.attributes)) if (v) fd.set(`attr_${k}`, v);
    if (result.meli) {
      fd.set("meliUrl", result.meli.productUrl);
      fd.set("meliPrice", String(result.meli.price));
      if (result.meli.oldPrice) fd.set("meliOldPrice", String(result.meli.oldPrice));
    }
    startTransition(async () => {
      try {
        await createProductFromDraft(fd);
      } catch (e) {
        setCreating(false);
        setCreateError(e instanceof Error ? e.message : "Erro ao publicar o produto. Tente novamente.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Painel de entrada (como um chat) */}
      <div className="space-y-5 lg:col-span-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Bot className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-ink-950">Assistente de produtos com IA</h2>
              <p className="text-xs text-ink-400">Cole o link do produto (meli.la) ou descreva o item + fotos. A IA monta a página inteira.</p>
            </div>
          </div>

          <div className="space-y-4">              <Field label="Link do produto (opcional)" hint="Ex.: https://meli.la/2JrJehi — extrai nome, preço e imagem reais">
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
                  <input value={link} onChange={(e) => setLink(e.target.value)} className={`${inputCls} pl-10`} placeholder={"https://meli.la/..."} />
                </div>
              </Field>              <Field label="Ou descreva o produto" hint="Marca, modelo, capacidade, cor, características — quanto mais detalhes, melhor a página">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputCls} placeholder={"Ex.: Smartphone Samsung Galaxy A17, 128GB, 4GB RAM, tela 6,7\", câmera 50MP..."} />
            </Field>

            <Field label="Fotos da galeria (opcional)" hint="Uma URL por linha — a IA organiza na galeria do produto">
              <div className="relative">
                <ImageIcon className="pointer-events-none absolute left-3.5 top-3 size-4 text-ink-400" aria-hidden />
                <textarea value={photos} onChange={(e) => setPhotos(e.target.value)} rows={3} className={`${inputCls} pl-10 font-mono text-xs`} placeholder={"https://http2.mlstatic.com/foto1.webp\nhttps://http2.mlstatic.com/foto2.webp"} />
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria *">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Marca *" hint="Necessária para criar o produto">
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
              {isPending ? "Gerando página com IA..." : "Gerar página com IA"}
            </button>
          </div>
        </div>

        {result && !result.ok && (
          <div className="flex items-start gap-3 rounded-2xl border border-flash-200 bg-flash-50 p-4 text-sm text-flash-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Não foi possível gerar a página</p>
              <p className="mt-0.5">{result.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Resultado */}
      <div className="lg:col-span-2">
        {!result && (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-6 text-center">
            <Sparkles className="mx-auto size-8 text-ink-300" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-ink-500">A página gerada pela IA aparecerá aqui</p>
            <p className="mt-1 text-xs text-ink-400">Revise o conteúdo antes de publicar.</p>
          </div>
        )}

        {result?.ok && (
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-500" aria-hidden />
              <h3 className="font-display text-sm font-bold text-ink-950">Página gerada com sucesso!</h3>
            </div>

            <p className="font-display text-base font-extrabold leading-snug text-ink-950">{result.draft.name}</p>
            {result.draft.summary && <p className="mt-2 text-xs leading-relaxed text-ink-500">{result.draft.summary}</p>}

            {result.draft.galleryImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {result.draft.galleryImages.slice(0, 6).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-lg border border-ink-100 object-cover" />
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2 text-xs text-ink-600">
              <p><strong className="text-ink-800">Descrição:</strong> {result.draft.description.length} caracteres</p>
              <p><strong className="text-ink-800">Ficha técnica:</strong> {Object.values(result.draft.attributes).filter(Boolean).length} campos preenchidos</p>
              <p><strong className="text-ink-800">Tags:</strong> {result.draft.tags.length}</p>
              {result.meli && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">
                  Oferta do Mercado Livre incluída — botão "Comprar" com seu link de afiliado.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={createProduct}
              disabled={creating || isPending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              {creating ? "Publicando..." : "Criar produto e publicar"}
            </button>
            {createError && (
              <p className="mt-3 flex items-start gap-1.5 text-xs font-semibold text-flash-600">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {createError}
              </p>
            )}
            {!brandId && !createError && <p className="mt-3 text-xs text-ink-400">Selecione a marca acima para publicar.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
