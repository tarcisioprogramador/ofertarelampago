import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgePercent, Truck } from "lucide-react";
import { formatBRL, percentOff } from "@/lib/utils";
import { RatingStars } from "./rating-stars";

export type ProductCardData = {
  name: string;
  slug: string;
  imageUrl: string | null;
  brandName: string;
  categorySlug: string;
  categoryName: string;
  rating: number;
  reviewCount: number;
  bestOffer: { price: number; oldPrice: number | null; couponCode: string | null; shipping: string | null; storeName: string } | null;
};

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const href = `/${product.categorySlug}/${product.brandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}/${product.slug}/`;
  const discount = percentOff(product.bestOffer?.oldPrice, product.bestOffer?.price);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <Link href={href} className="absolute inset-0 z-10" aria-label={product.name} tabIndex={-1} />

      {/* Imagem + badges */}
      <div className="relative h-40 overflow-hidden bg-ink-50">
        <Image
          src={product.imageUrl ?? "/images/products/celulares.svg"}
          alt={product.name}
          width={320}
          height={160}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
          {discount && <span className="rounded-lg bg-flash-500 px-2 py-0.5 text-xs font-extrabold text-white shadow-sm">-{discount}%</span>}
          {product.reviewCount > 1500 && (
            <span className="rounded-lg bg-ink-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">Mais vendido</span>
          )}
        </div>
        {product.bestOffer && (
          <span className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink-700 shadow-sm backdrop-blur-sm">
            <Truck className="size-3 text-brand-600" aria-hidden />
            {product.bestOffer.storeName}
          </span>
        )}
      </div>

      {/* Corpo */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{product.categoryName}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">{product.name}</h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-500">
          <RatingStars rating={product.rating} />
          <span className="font-semibold text-ink-700">{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount.toLocaleString("pt-BR")})</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {product.bestOffer?.oldPrice && (
              <p className="text-xs text-ink-400 line-through">{formatBRL(product.bestOffer.oldPrice)}</p>
            )}
            <p className="font-display text-xl font-extrabold tracking-tight text-ink-950">
              {product.bestOffer ? formatBRL(product.bestOffer.price, 0) : "Sem oferta"}
            </p>
          </div>
        </div>

        {product.bestOffer?.couponCode && (
          <p className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <BadgePercent className="size-3" aria-hidden />
            Cupom: {product.bestOffer.couponCode}
          </p>
        )}

        <span className="pointer-events-none relative z-20 mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-brand-500">
          Ver oferta
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}
