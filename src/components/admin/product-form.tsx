"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, inputCls, SubmitButton } from "./ui";

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

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    for (const [k, v] of Object.entries(attrs)) data.set(`attr_${k}`, v);
    void saveAction(data);
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
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
