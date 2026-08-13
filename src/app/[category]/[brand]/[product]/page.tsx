import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, BadgePercent, BellRing, CalendarDays, Check, Copy, GitCompareArrows, Minus, Plus, ShoppingBag, Star, Truck, X, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { productJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";
import { RatingStars, RatingBadge } from "@/components/rating-stars";
import { PriceChart } from "@/components/price-chart";
import { AlertPriceForm } from "@/components/alert-price-form";
import { FaqAccordion } from "@/components/faq-accordion";
import { SectionHeading } from "@/components/section-heading";
import { ProductGallery } from "@/components/product-gallery";
import { formatBRL, formatDate, percentOff } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; brand: string; product: string }> };

export async function generateMetadata({ params }: Props): Promise<ReturnType<typeof buildMetadata>> {
  const { category, brand, product } = await params;
  const p = await prisma.product.findUnique({
    where: { slug: product, category: { slug: category }, brand: { slug: brand } },
    include: { brand: true, offers: { orderBy: { price: "asc" } } },
  });
  if (!p) return {};
  const best = p.offers.find((o) => o.active) ?? null;
  return buildMetadata({
    title: `${p.name}: preço, ficha técnica e avaliações`,
    description: `${p.summary ?? p.name}. Compare preços em ${p.offers.length || 0} lojas${best ? ` — a partir de ${formatBRL(best.price)}` : ""}, veja a ficha técnica completa e o histórico de preços.`,
    path: `/${category}/${brand}/${p.slug}/`,
    type: "product",
  });
}

export default async function ProductPage({ params }: Props) {
  const { category, brand, product } = await params;

  const [prod, history, comparisons, similar, articles, catDeals, tagData] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: product, category: { slug: category }, brand: { slug: brand } },
      include: {
        brand: true,
        category: true,
        offers: { include: { store: true }, orderBy: { price: "asc" } },
        attributes: { include: { attribute: true }, orderBy: { attribute: { order: "asc" } } },
        images: { orderBy: { order: "asc" } },
        pros: { orderBy: { order: "asc" } },
        reviews: { orderBy: { createdAt: "desc" } },
        faqs: { orderBy: { order: "asc" } },
      },
    }),
    prisma.priceHistory.findMany({
      where: { product: { slug: product } },
      orderBy: { recordedAt: "asc" },
      select: { price: true, recordedAt: true },
    }).catch(() => []),
    prisma.comparison.findMany({
      where: { items: { some: { product: { slug: product } } } },
      include: { items: { include: { product: { include: { brand: true } } }, orderBy: { order: "asc" } } },
    }).catch(() => []),
    prisma.product.findMany({
      where: { category: { slug: category }, NOT: { slug: product } },
      include: { brand: true, category: true, offers: { include: { store: true }, orderBy: { price: "asc" } } },
      take: 4,
      orderBy: { rating: "desc" },
    }).catch(() => []),
    prisma.article.findMany({
      where: { published: true, products: { some: { product: { slug: product } } } },
      include: { author: true, category: true },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }).catch(() => []),
    prisma.deal.findMany({
      where: { status: "ACTIVE", endAt: { gt: new Date() }, product: { slug: product } },
      include: { store: true, product: true },
    }).catch(() => []),
    prisma.product.findUnique({
      where: { slug: product },
      select: { tags: { include: { tag: true } } },
    }).catch(() => null),
  ]);

  if (!prod) notFound();

  const activeOffers = prod.offers.filter((o) => o.active);
  const bestOffer = activeOffers[0] ?? null;
  const noActiveOffer = prod.offers.length > 0 && activeOffers.length === 0;

  const productPath = `/${category}/${brand}/${prod.slug}/`;
  const discounts = prod.offers.map((o) => percentOff(o.oldPrice, o.price)).filter((d): d is number => d !== null);
  const maxDiscount = discounts.length ? Math.max(...discounts) : 0;

  const chartData = history.map((h) => ({ date: h.recordedAt.toISOString(), price: h.price }));
  const prices = history.map((h) => h.price);
  const low = prices.length ? Math.min(...prices) : 0;
  const high = prices.length ? Math.max(...prices) : 0;
  const average = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  const similarCards: ProductCardData[] = similar.map((p) => ({
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    brandName: p.brand.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    bestOffer: p.offers[0] ? { price: p.offers[0].price, oldPrice: p.offers[0].oldPrice, couponCode: p.offers[0].couponCode, shipping: p.offers[0].shipping, storeName: p.offers[0].store.name } : null,
  }));

  const articleCards: ArticleCardData[] = articles.map((a) => ({
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    type: a.type,
    publishedAt: a.publishedAt,
    authorName: a.author?.name,
    categoryName: a.category?.name,
  }));

  const editorial = prod.reviews.find((r) => r.authorName.includes("Redação"));
  const userReviews = prod.reviews.filter((r) => !r.authorName.includes("Redação"));

  const tags = tagData?.tags.map((t) => t.tag) ?? [];

  const crumbs = [
    { name: prod.category.name, href: `/${prod.category.slug}/` },
    { name: prod.brand.name, href: `/${prod.category.slug}/${prod.brand.slug}/` },
    { name: prod.name, href: productPath },
  ];

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name: prod.name,
          description: prod.summary ?? prod.description ?? "",
          image: prod.imageUrl ?? "/images/products/celulares.svg",
          brand: prod.brand.name,
          category: prod.category.name,
          url: productPath,
          offers: prod.offers.filter((o) => o.active).map((o) => ({ price: o.price, oldPrice: o.oldPrice, storeName: o.store.name, url: o.url || "#", couponCode: o.couponCode, updatedAt: o.updatedAt })),
          rating: prod.rating,
          reviewCount: prod.reviewCount,
          reviews: prod.reviews.slice(0, 5).map((r) => ({ author: r.authorName, rating: r.rating, title: r.title, content: r.content, date: r.createdAt })),
          breadcrumbs: [{ name: "Início", path: "/" }, ...crumbs],
          faqs: prod.faqs.map((f) => ({ question: f.question, answer: f.answer })),
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={crumbs} />

        {/* ─── TOPO ─────────────────────────────────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Imagem + galeria */}
          <div className="relative">
            <ProductGallery mainImage={prod.imageUrl} images={prod.images.map((i) => i.url)} name={prod.name} />
            <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
              {maxDiscount > 0 && <span className="rounded-lg bg-flash-500 px-2.5 py-1 text-sm font-extrabold text-white shadow-sm">-{maxDiscount}% OFF</span>}
              {prod.isNew && <span className="rounded-lg bg-ink-950/85 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">Novo</span>}
            </div>
          </div>

          {/* Resumo + ações */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {prod.brand.name} · {prod.category.name}
            </p>
            <h1 className="font-display mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink-950 sm:text-3xl">{prod.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <RatingBadge rating={prod.rating} />
                <RatingStars rating={prod.rating} />
              </div>
              <span className="text-sm text-ink-500">{prod.reviewCount.toLocaleString("pt-BR")} avaliações</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { icon: CalendarDays, label: "Lançamento", value: formatDate(prod.releaseDate) },
                { icon: Star, label: "Nota editorial", value: `${editorial?.rating ?? "—"} / 5` },
                { icon: ShoppingBag, label: "Lojas monitoradas", value: `${prod.offers.length} lojas` },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-ink-100 bg-white p-3 shadow-card">
                  <f.icon className="size-4 text-brand-600" aria-hidden />
                  <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{f.label}</p>
                  <p className="text-sm font-bold text-ink-900">{f.value}</p>
                </div>
              ))}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-ink-600">{prod.summary}</p>

            {/* Preço destaque */}
            {noActiveOffer ? (
              <div className="mt-6 rounded-2xl border border-flash-200 bg-flash-50/70 p-5">
                <p className="text-xs font-extrabold uppercase tracking-widest text-flash-600">⏰ Oferta encerrada</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">
                  As ofertas deste produto foram encerradas ou estão fora do ar no momento. A página continua ativa com ficha técnica e histórico de preço.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link href="/ofertas-relampago/" className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600">
                    <Zap className="size-4" aria-hidden /> Ver ofertas atuais
                  </Link>
                </div>
              </div>
            ) : bestOffer ? (
              <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Melhor preço hoje · <span className="text-brand-700">{bestOffer.store.name}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                      {bestOffer.oldPrice && <span className="text-sm text-ink-400 line-through">{formatBRL(bestOffer.oldPrice, 0)}</span>}
                      <span className="font-display text-3xl font-extrabold tracking-tight text-ink-950">{formatBRL(bestOffer.price, 0)}</span>
                      {percentOff(bestOffer.oldPrice, bestOffer.price) && (
                        <span className="rounded-md bg-flash-500 px-2 py-0.5 text-sm font-extrabold text-white">-{percentOff(bestOffer.oldPrice, bestOffer.price)}%</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      <Truck className="mr-1 inline size-3.5 text-brand-600" aria-hidden />
                      {bestOffer.shipping}
                      {bestOffer.couponCode && (
                        <>
                          {" "}· <BadgePercent className="mr-0.5 inline size-3.5 text-emerald-600" aria-hidden />
                          <span className="font-semibold text-emerald-700">cupom {bestOffer.couponCode}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <a href="#ofertas" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600">
                    Ver todas as ofertas <ArrowRight className="size-4" aria-hidden />
                  </a>
                  {bestOffer.url && (
                    <a
                      href={bestOffer.url}
                      target="_blank"
                      rel="noopener nofollow"
                      className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-5 py-3 text-sm font-bold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-600"
                    >
                      <ShoppingBag className="size-4" aria-hidden /> Comprar
                    </a>
                  )}
                  <a href="#alerta-preco" className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-5 py-3 text-sm font-bold text-ink-800 transition-colors hover:border-brand-400 hover:text-brand-600">
                    <BellRing className="size-4" aria-hidden /> Criar alerta de preço
                  </a>
                </div>
              </div>
            ) : null}

            {catDeals.length > 0 && (
              <div className="mt-4 rounded-2xl border border-flash-500/30 bg-gradient-to-r from-flash-50 to-white p-4">
                <p className="text-xs font-extrabold uppercase tracking-widest text-flash-600">⚡ Em oferta relâmpago</p>
                <p className="mt-1 text-sm text-ink-700">
                  <strong>{formatBRL(catDeals[0].price, 0)}</strong> via {catDeals[0].store.name}
                  {catDeals[0].oldPrice > catDeals[0].price && <> · de {formatBRL(catDeals[0].oldPrice, 0)}</>}
                  {catDeals[0].couponCode && <> · cupom <strong>{catDeals[0].couponCode}</strong></>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── MELHORES OFERTAS ──────────────────────────────────────────── */}
        {prod.offers.length > 0 && (
          <section id="ofertas" className="mt-14 scroll-mt-24">
            <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">Melhores ofertas do {prod.name}</h2>
            {noActiveOffer && (
              <p className="mb-4 rounded-xl border border-flash-200 bg-flash-50/60 px-4 py-3 text-sm text-ink-700">
                ⏰ <strong>Oferta encerrada.</strong> As ofertas cadastradas para este produto estão inativas no momento — confira as <Link href="/ofertas-relampago/" className="font-bold text-flash-600 underline underline-offset-2">ofertas atuais</Link> ou crie um <a href="#alerta-preco" className="font-bold text-brand-600 underline underline-offset-2">alerta de preço</a>.
              </p>
            )}
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                    <th className="px-5 py-3.5 font-bold">Loja</th>
                    <th className="px-5 py-3.5 font-bold">Preço</th>
                    <th className="px-5 py-3.5 font-bold">Desconto</th>
                    <th className="px-5 py-3.5 font-bold">Frete</th>
                    <th className="px-5 py-3.5 font-bold">Cupom</th>
                    <th className="px-5 py-3.5 font-bold">Atualizado em</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {prod.offers.map((o) => {
                    const off = percentOff(o.oldPrice, o.price);
                    return (
                      <tr key={o.id} className={`border-b border-ink-50 transition-colors hover:bg-brand-50/40 ${o === bestOffer ? "bg-brand-50/60" : ""} ${!o.active ? "opacity-50" : ""}`}>
                        <td className="px-5 py-4 font-bold text-ink-900">
                          {o.store.name}
                          {o === bestOffer && <span className="ml-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">MELHOR OFERTA</span>}
                        </td>
                        <td className="px-5 py-4">
                          {o.oldPrice && <span className="mr-2 text-xs text-ink-400 line-through">{formatBRL(o.oldPrice, 0)}</span>}
                          <span className="font-display text-base font-extrabold text-ink-950">{formatBRL(o.price, 0)}</span>
                        </td>
                        <td className="px-5 py-4">{off ? <span className="rounded-md bg-flash-500 px-1.5 py-0.5 text-xs font-extrabold text-white">-{off}%</span> : <span className="text-ink-300">—</span>}</td>
                        <td className="px-5 py-4 text-xs text-ink-600">{o.shipping}</td>
                        <td className="px-5 py-4">{o.couponCode ? <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-mono text-xs font-bold text-emerald-700">{o.couponCode}</span> : <span className="text-ink-300">—</span>}</td>
                        <td className="px-5 py-4 text-xs text-ink-400">{formatDate(o.updatedAt)}</td>
                        <td className="px-5 py-4 text-right">
                          {o.active ? (
                            o.url ? (
                              <a
                                href={o.url}
                                target="_blank"
                                rel="noopener nofollow"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-950 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                              >
                                Ver oferta <ArrowUpRight className="size-3.5" aria-hidden />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700">
                                Ativa
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3.5 py-2 text-xs font-bold text-ink-400">
                              Encerrada
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              Preços sujeitos a alteração.
              {prod.lastPriceCheck && <> · Última verificação de preço: <strong>{formatDate(prod.lastPriceCheck)}</strong></>}
              {prod.lastStockCheck && <> · Última verificação de estoque: <strong>{formatDate(prod.lastStockCheck)}</strong></>}
            </p>
          </section>
        )}

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-14">
            {/* ─── FICHA RÁPIDA ──────────────────────────────────────────── */}
            {prod.attributes.length > 0 && (
              <section id="especificacoes" className="scroll-mt-24">
                <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">Ficha técnica do {prod.name}</h2>
                <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
                  <dl>
                    {prod.attributes.slice(0, 6).map((a, i) => (
                      <div key={a.id} className={`flex items-start justify-between gap-6 px-5 py-3.5 ${i % 2 ? "bg-ink-50/60" : ""}`}>
                        <dt className="text-sm font-semibold text-ink-500">{a.attribute.name}</dt>
                        <dd className="text-right text-sm font-semibold text-ink-900">{a.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {prod.attributes.length > 6 && (
                  <details className="mt-3 rounded-2xl border border-ink-100 bg-white shadow-card">
                    <summary className="flex cursor-pointer list-none items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-brand-600 hover:bg-brand-50 [&::-webkit-details-marker]:hidden">
                      <Plus className="size-4" aria-hidden /> Ver especificações completas
                    </summary>
                    <dl className="border-t border-ink-100">
                      {prod.attributes.slice(6).map((a, i) => (
                        <div key={a.id} className={`flex items-start justify-between gap-6 px-5 py-3.5 ${i % 2 ? "bg-ink-50/60" : ""}`}>
                          <dt className="text-sm font-semibold text-ink-500">{a.attribute.name}</dt>
                          <dd className="text-right text-sm font-semibold text-ink-900">{a.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </section>
            )}

            {/* ─── HISTÓRICO DE PREÇO ────────────────────────────────────── */}
            <section id="historico" className="scroll-mt-24">
              <h2 className="font-display mb-2 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">Histórico de preço</h2>
              <p className="mb-5 text-sm text-ink-500">
                Acompanhe a evolução do preço nos últimos 12 meses. O melhor momento para comprar é quando o preço está no menor patamar do período.
              </p>
              <PriceChart data={chartData} currentPrice={bestOffer?.price ?? 0} high={high} low={low} average={average} />
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="#alerta-preco" className="inline-flex items-center gap-2 rounded-xl bg-flash-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-flash-600">
                  <BellRing className="size-4" aria-hidden />
                  Avise-me quando o preço cair
                </a>
              </div>
            </section>

            {/* ─── COMPARAÇÕES ───────────────────────────────────────────── */}
            {comparisons.length > 0 && (
              <section id="comparacoes" className="scroll-mt-24">
                <SectionHeading title={`Comparações com o ${prod.name}`} href="/comparar/" linkLabel="Ver comparador" />
                <div className="space-y-3">
                  {comparisons.map((cmp) => (
                    <Link key={cmp.id} href={`/comparar/${cmp.slug}/`} className="group flex flex-wrap items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
                      <div className="flex items-center gap-1.5">
                        {cmp.items.map((item, i) => (
                          <span key={item.id} className="flex items-center gap-1.5">
                            <span className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-bold text-ink-800">{item.product.brand.name}</span>
                            {i < cmp.items.length - 1 && <span className="text-[10px] font-black text-brand-500">VS</span>}
                          </span>
                        ))}
                      </div>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                        Ver comparação <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ─── ANÁLISE EDITORIAL ─────────────────────────────────────── */}
            {editorial && (
              <section id="avaliacao" className="scroll-mt-24">
                <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">Análise do produto</h2>
                <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-flash-500 font-display text-xl font-extrabold text-white">{editorial.rating}.0</span>
                      <div>
                        <p className="font-bold text-ink-950">Nota da redação</p>
                        <p className="text-xs text-ink-500">Por {editorial.authorName}</p>
                      </div>
                    </div>
                    <RatingStars rating={editorial.rating} size={18} />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                        <Check className="size-3.5" aria-hidden /> Pontos positivos
                      </p>
                      <p className="text-sm leading-relaxed text-ink-700">{editorial.pros}</p>
                    </div>
                    <div className="rounded-xl border border-flash-100 bg-flash-50/50 p-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-flash-600">
                        <X className="size-3.5" aria-hidden /> Pontos negativos
                      </p>
                      <p className="text-sm leading-relaxed text-ink-700">{editorial.cons}</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm leading-relaxed text-ink-600">
                    {editorial.content.split("\n").filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                    <p className="text-xs text-ink-400">Análise original da redação do Oferta Relâmpago, baseada em testes e dados verificáveis. <Link href="/como-avaliamos/" className="font-semibold text-brand-600 underline underline-offset-2">Saiba como avaliamos</Link>.</p>
                  </div>
                </div>

                {/* Prós e contras listados */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-card">
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-emerald-700">Prós</p>
                    <ul className="space-y-2">
                      {prod.pros.filter((p) => p.type === "PRO").map((p) => (
                        <li key={p.id} className="flex items-start gap-2 text-sm text-ink-700">
                          <Plus className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden /> {p.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-flash-100 bg-white p-5 shadow-card">
                    <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-flash-600">Contras</p>
                    <ul className="space-y-2">
                      {prod.pros.filter((p) => p.type === "CON").map((p) => (
                        <li key={p.id} className="flex items-start gap-2 text-sm text-ink-700">
                          <Minus className="mt-0.5 size-4 shrink-0 text-flash-500" aria-hidden /> {p.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* ─── REVIEWS DE USUÁRIOS ───────────────────────────────────── */}
            {userReviews.length > 0 && (
              <section id="avaliacoes" className="scroll-mt-24">
                <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">
                  Avaliações de quem comprou <span className="text-ink-400">({userReviews.length})</span>
                </h2>
                <div className="space-y-3">
                  {userReviews.map((r) => (
                    <article key={r.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 place-items-center rounded-full bg-ink-100 text-sm font-bold text-ink-700">{r.authorName[0]}</span>
                          <div>
                            <p className="text-sm font-bold text-ink-900">{r.authorName}</p>
                            <p className="flex items-center gap-1 text-[11px] text-ink-400">
                              <RatingStars rating={r.rating} size={11} />
                              {formatDate(r.createdAt)}
                              {r.verified && <span className="ml-1 rounded bg-emerald-50 px-1 py-px font-semibold text-emerald-600">Compra verificada</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                      {r.title && <p className="mt-3 font-bold text-ink-900">{r.title}</p>}
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{r.content}</p>
                      {(r.pros || r.cons) && (
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-500">
                          {r.pros && <span>👍 {r.pros}</span>}
                          {r.cons && <span>👎 {r.cons}</span>}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ─── SIDEBAR: ALERTA + FLASH ─────────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div id="alerta-preco" className="scroll-mt-24 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-ink-950">
                <BellRing className="size-4 text-brand-600" aria-hidden />
                Alerta de preço
              </h3>
              <AlertPriceForm productId={prod.id} productName={prod.name} currentPrice={bestOffer?.price ?? 0} />
            </div>

            <div className="rounded-2xl bg-ink-950 p-5 text-white">
              <p className="text-xs font-extrabold uppercase tracking-widest text-brand-400">Resumo rápido</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-ink-400">Menor preço (1 ano)</dt><dd className="font-bold text-emerald-400">{formatBRL(low, 0)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-400">Maior preço (1 ano)</dt><dd className="font-bold">{formatBRL(high, 0)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-400">Preço médio</dt><dd className="font-bold">{formatBRL(average, 0)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-400">Preço atual</dt><dd className="font-bold text-brand-400">{bestOffer ? formatBRL(bestOffer.price, 0) : "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-400">Em relação à média</dt><dd className="font-bold">{bestOffer && average ? `${bestOffer.price <= average ? "▼" : "▲"} ${Math.abs(Math.round(((bestOffer.price - average) / average) * 100))}%` : "—"}</dd></div>
              </dl>
              {bestOffer?.url ? (
                <a
                  href={bestOffer.url}
                  target="_blank"
                  rel="noopener nofollow"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                >
                  <ShoppingBag className="size-4" aria-hidden />
                  Comprar
                </a>
              ) : !bestOffer ? (
                <a
                  href={`/comparar/?add=${prod.slug}`}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  <GitCompareArrows className="size-4" aria-hidden />
                  Comparar com outros modelos
                </a>
              ) : null}
            </div>
          </aside>
        </div>

        {/* ─── PRODUTOS SIMILARES ────────────────────────────────────────── */}
        {similarCards.length > 0 && (
          <section className="mt-16" aria-labelledby="similar-heading">
            <SectionHeading title={`Produtos similares em ${prod.category.name}`} href={`/${prod.category.slug}/`} linkLabel="Ver categoria" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {similarCards.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ─── ARTIGOS RELACIONADOS ──────────────────────────────────────── */}
        {articleCards.length > 0 && (
          <section className="mt-16" aria-labelledby="related-articles">
            <SectionHeading title="Artigos relacionados" href="/blog/" linkLabel="Ver blog" />
            <div className="grid gap-4 sm:grid-cols-3">
              {articleCards.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* ─── FAQ DO PRODUTO ────────────────────────────────────────────── */}
        {prod.faqs.length > 0 && (
          <section className="mt-16 max-w-3xl" aria-labelledby="product-faq">
            <h2 id="product-faq" className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">
              Perguntas frequentes sobre o {prod.name}
            </h2>
            <FaqAccordion items={prod.faqs} />
          </section>
        )}

        {/* ─── DESCRIÇÃO SEO ─────────────────────────────────────────────── */}
        {prod.description && (
          <section className="mt-16 border-t border-ink-100 pt-8">
            <h2 className="font-display mb-3 text-lg font-bold text-ink-950">Vale a pena comprar o {prod.name}?</h2>
            <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-ink-600">
              {prod.description.split("\n").filter(Boolean).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="text-xs text-ink-400">
                Este conteúdo é original e atualizado pela redação. Dados técnicos podem variar conforme a versão e a região do produto.
              </p>
            </div>
          </section>
        )}

        {/* ─── TAGS SEO ────────────────────────────────────────────────────── */}
        {tags.length > 0 && (
          <section className="mt-12" aria-label="Tags do produto">
            <ul className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/busca/?q=${encodeURIComponent(t.name)}`}
                    className="inline-block rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600"
                  >
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
