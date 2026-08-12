"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Sparkles } from "lucide-react";
import { Field, inputCls, SubmitButton } from "./ui";
import { fetchMeliPreview } from "@/lib/admin-actions";

export type AttrDef = { id: string; key: string; name: string; type: string };
export type CatOption = { id: string; name: string; attributeDefs: AttrDef[] };
export type BrandOption = { id: string; name: string };

type ProductFormProps = {
  categories: CatOption[];
  brands: BrandOption[];
  saveAction: (formData: FormData) => Promise<void>;
  initial?: {
    id?: string;
    name: string;
    slug: string;
    brandId: string;
    categoryId: string;
    summary: string;
    description: string;
    imageUrl: string;
    galleryImages?: string[];
    releaseDate: string;
    rating: number;
    reviewCount: number;
    featured: boolean;
    isNew: boolean;
    attributes: Record<string, string>;
    pros: string;
    cons: string;
    tags?: string;
  };
};

export function ProductForm({ categories, brands, saveAction, initial }: ProductFormProps) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [attrs, setAttrs] = useState<Record<string, string>>(initial?.attributes ?? {});

  const currentCat = useMemo(() => categories.find((c) => c.id === categoryId), [categoryId, categories]);

  const [meliLink, setMeliLink] = useState("");
  const [pulling, setPulling] = useState(false);
  const [pullError, setPullError] = useState("");

  async function pullFromLink() {
    if (!meliLink.trim() || pulling) return;
    setPulling(true);
    setPullError("");
    try {
      const fd = new FormData();
      fd.set("link", meliLink.trim());
      const res = await fetchMeliPreview(fd);
      if (!res.ok) {
        setPullError(res.error);
        return;
      }
      // Preenche automaticamente título, imagem, oferta (preço) e link de afiliado
      if (res.data.name) setName(res.data.name);
      const nameInput = document.querySelector<HTMLInputElement>('input[name="name"]');
      if (nameInput && res.data.name) nameInput.value = res.data.name;
      const slugInput = document.querySelector<HTMLInputElement>('input[name="slug"]');
      if (slugInput && !slugInput.value) slugInput.value = res.data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const imgInput = document.querySelector<HTMLInputElement>('input[name="imageUrl"]');
      if (imgInput && res.data.imageUrl) imgInput.value = res.data.imageUrl;
      // Oferta automática
      const priceInput = document.querySelector<HTMLInputElement>('input[name="offerPrice"]');
      if (priceInput && res.data.price) priceInput.value = String(res.data.price);
      const oldPriceInput = document.querySelector<HTMLInputElement>('input[name="offerOldPrice"]');
      if (oldPriceInput && res.data.oldPrice) oldPriceInput.value = String(res.data.oldPrice);
      const urlInput = document.querySelector<HTMLInputElement>('input[name="offerUrl"]');
      if (urlInput && res.data.productUrl) urlInput.value = res.data.productUrl;
      setMeliLink("");
    } catch {
      setPullError("Erro ao buscar os dados do link. Tente novamente.");
    } finally {
      setPulling(false);
    }
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    for (const [k, v] of Object.entries(attrs)) data.set(`attr_${k}`, v);
    void saveAction(data);
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {/* Busca automática pelo link de afiliado do Mercado Livre */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-700">
          <Sparkles className="size-3.5" aria-hidden /> Importar dados do Mercado Livre
        </p>
        <p className="mb-3 text-xs text-ink-500">Cole seu link de afiliado e o site preenche título, preço e imagem automaticamente.</p>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
            <input
              value={meliLink}
              onChange={(e) => setMeliLink(e.target.value)}
              className={`${inputCls} pl-10`}
              placeholder="https://meli.la/2JrJehi"
              aria-label="Link de afiliado do Mercado Livre"
            />
          </div>
          <button
            type="button"
            onClick={pullFromLink}
            disabled={pulling || !meliLink.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pulling ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {pulling ? "Buscando..." : "Buscar dados"}
          </button>
        </div>
        {pullError && <p className="mt-2 text-xs font-semibold text-flash-600">{pullError}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome do produto *">
          <input required name="name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Samsung Galaxy A17 5G" />
        </Field>
        <Field label="Slug (URL)" hint="Em branco = gerado automaticamente">
          <input name="slug" defaultValue={initial?.slug ?? ""} className={inputCls} placeholder="galaxy-a17-5g" />
        </Field>
        <Field label="Marca *">
          <select required name="brandId" defaultValue={initial?.brandId ?? ""} className={inputCls}>
            <option value="">Selecione...</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Categoria *" hint="Altera os campos de ficha técnica abaixo">
          <select required name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Resumo (aparece na busca)">
          <textarea name="summary" defaultValue={initial?.summary ?? ""} rows={2} className={inputCls} placeholder="Smartphone com tela Super AMOLED, 5G e bateria de 5.000 mAh..." />
        </Field>
        <Field label="URL da imagem principal">
          <input name="imageUrl" defaultValue={initial?.imageUrl ?? "/images/products/celulares.svg"} className={inputCls} />
        </Field>
        <Field label="Fotos da galeria" hint="Uma URL por linha">
          <textarea
            name="galleryImages"
            defaultValue={(initial?.galleryImages ?? []).join("\n")}
            rows={4}
            className={`${inputCls} font-mono text-xs`}
            placeholder={"https://http2.mlstatic.com/foto1.webp\nhttps://http2.mlstatic.com/foto2.webp"}
          />
        </Field>
        <Field label="Data de lançamento">
          <input type="date" name="releaseDate" defaultValue={initial?.releaseDate ?? ""} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nota (0–5)">
            <input type="number" step="0.1" min="0" max="5" name="rating" defaultValue={initial?.rating ?? 0} className={inputCls} />
          </Field>
          <Field label="Nº de avaliações">
            <input type="number" min="0" name="reviewCount" defaultValue={initial?.reviewCount ?? 0} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} className="size-4 accent-brand-500" /> Em destaque na Home
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <input type="checkbox" name="isNew" defaultChecked={initial?.isNew} className="size-4 accent-brand-500" /> Produto novo
        </label>
      </div>

      <div>
        <h3 className="font-display mb-1 text-sm font-bold text-ink-900">Descrição completa (SEO)</h3>
        <p className="mb-2 text-xs text-ink-400">Texto com 2 a 4 parágrafos. Use parágrafos separados por linha em branco.</p>
        <textarea name="description" defaultValue={initial?.description ?? ""} rows={6} className={inputCls} placeholder="O produto... Ele combina... É uma das melhores opções..." />
      </div>

      {currentCat && (
        <div>
          <h3 className="font-display mb-1 text-sm font-bold text-ink-900">Ficha técnica · {currentCat.name}</h3>
          <p className="mb-2 text-xs text-ink-400">Campos definidos pela categoria. Para novos atributos, edite as categorias.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentCat.attributeDefs.map((def) => (
              <Field key={def.id} label={def.name}>
                <input
                  value={attrs[def.key] ?? ""}
                  onChange={(e) => setAttrs((prev) => ({ ...prev, [def.key]: e.target.value }))}
                  className={inputCls}
                  placeholder={def.type === "boolean" ? "Sim/Não" : "Ex.: 6,6\" Super AMOLED, 120 Hz"}
                />
              </Field>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-500">Oferta do Mercado Livre (opcional)</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Preço (R$)" hint="Preenchido automaticamente pelo link">
            <input type="number" step="0.01" name="offerPrice" className={inputCls} placeholder="758,70" />
          </Field>
          <Field label="Preço anterior (R$)">
            <input type="number" step="0.01" name="offerOldPrice" className={inputCls} placeholder="1.049,00" />
          </Field>
          <Field label="Link da oferta (afiliado)">
            <input name="offerUrl" className={inputCls} placeholder="https://meli.la/..." />
          </Field>
        </div>
      </div>

      <Field label="Tags SEO" hint="Separadas por vírgula. Ex.: Galaxy A07, celular barato, Samsung, 128GB">
        <input name="tags" defaultValue={initial?.tags ?? ""} className={inputCls} placeholder="Galaxy A07, celular custo-benefício, Samsung barato" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pontos positivos" hint="Um por linha">
          <textarea name="pros" defaultValue={initial?.pros ?? ""} rows={4} className={inputCls} placeholder={"Tela ótima\nBateria dura o dia todo"} />
        </Field>
        <Field label="Pontos negativos" hint="Um por linha">
          <textarea name="cons" defaultValue={initial?.cons ?? ""} rows={4} className={inputCls} placeholder={"Sem carregador\nCarregamento lento"} />
        </Field>
      </div>

      <div className="flex gap-3">
        <SubmitButton>{initial?.id ? "Salvar alterações" : "Criar produto"}</SubmitButton>
        <button type="button" onClick={() => router.push("/admin/produtos/")} className="rounded-xl border border-ink-200 px-6 py-2.5 text-sm font-bold text-ink-600 transition-colors hover:bg-ink-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}
