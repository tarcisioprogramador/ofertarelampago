"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Galeria de fotos do produto: imagem principal + miniaturas clicáveis.
 * Usa a imagem principal (product.imageUrl) como primeira foto e a galeria como demais.
 */
export function ProductGallery({ mainImage, images, name }: { mainImage: string | null; images: string[]; name: string }) {
  const all = [mainImage, ...images].filter((u): u is string => !!u);
  const [active, setActive] = useState(0);
  const current = all[active] ?? "/images/products/celulares.svg";

  if (all.length <= 1) {
    return (
      <div className="relative h-72 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card sm:h-80">
        <Image src={current} alt={name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card sm:h-80">
        <Image src={current} alt={name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" />
      </div>
      {/* Miniaturas */}
      <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {all.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Foto ${i + 1} do produto`}
            className={`relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
              i === active ? "border-brand-500 shadow-card" : "border-ink-100 opacity-70 hover:opacity-100"
            }`}
          >
            <Image src={url} alt={`${name} — foto ${i + 1}`} fill className="object-cover" sizes="64px" />
          </button>
        ))}
      </div>
    </div>
  );
}
