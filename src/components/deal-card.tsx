import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Flame } from "lucide-react";
import { formatBRL, percentOff } from "@/lib/utils";
import { Countdown } from "./countdown";
import { RatingStars } from "./rating-stars";

export type DealCardData = {
  id: string;
  title: string;
  endAt: Date | string;
  oldPrice: number;
  price: number;
  couponCode: string | null;
  storeName: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  categorySlug: string;
  brandSlug: string;
  rating: number;
  reviewCount: number;
};

export function DealCard({ deal }: { deal: DealCardData }) {
  const discount = percentOff(deal.oldPrice, deal.price);
  const href = `/${deal.categorySlug}/${deal.brandSlug}/${deal.productSlug}/`;
  const endAt = deal.endAt instanceof Date ? deal.endAt.toISOString() : deal.endAt;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-flash-500/25 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/* Barra de urgência */}
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-flash-600 to-flash-500 px-4 py-1.5 text-white">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest">
          <Flame className="size-3.5 fill-white" aria-hidden />
          Oferta relâmpago
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Clock className="size-3.5" aria-hidden />
          Termina em:
        </span>
      </div>

      <Link href={href} className="absolute inset-0 z-10" aria-label={deal.productName} tabIndex={-1} />

      <div className="flex gap-4 p-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-ink-50">
          <Image src={deal.productImage ?? "/images/products/celulares.svg"} alt={deal.productName} width={96} height={96} className="h-full w-full object-cover" loading="lazy" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">{deal.productName}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-500">
            <RatingStars rating={deal.rating} size={12} />
            <span>{deal.rating.toFixed(1)} ({deal.reviewCount.toLocaleString("pt-BR")})</span>
          </div>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Via {deal.storeName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-flash-50/60 px-4 py-3">
        <div>
          <p className="text-xs text-ink-400 line-through">{formatBRL(deal.oldPrice, 0)}</p>
          <p className="flex items-baseline gap-2">
            <span className="font-display text-xl font-extrabold text-flash-600">{formatBRL(deal.price, 0)}</span>
            {discount && <span className="rounded-md bg-flash-500 px-1.5 py-0.5 text-xs font-extrabold text-white">-{discount}%</span>}
          </p>
        </div>
        <Countdown endAt={endAt} compact />
      </div>

      <div className="p-4 pt-3">
        <span className="pointer-events-none relative z-20 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-flash-600 to-flash-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all group-hover:shadow-md">
          Ver oferta
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </div>
    </article>
  );
}
