import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BadgePercent, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { collectionJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatBRL, formatDate, percentOff } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Ofertas de hoje: preços comparados em todas as lojas",
  description: "As melhores ofertas do dia em celulares, notebooks, TVs e muito mais. Compare preços nas principais lojas e economize.",
  path: "/ofertas/",
});

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category?: string }> };

export default async function OffersPage({ params }: Props) {
  const { category } = await (params as Promise<{ category?: string }>);
  const catSlug = category ?? "";

  const [categories, offers] = await Promise.all([
    prisma.category.findMany({ where: { products: { some: {} } }, orderBy: { order: "asc" }, select: { name: true, slug: true } }),
    prisma.offer.findMany({
      where: catSlug ? { product: { category: { slug: catSlug } } } : {},
      include: { product: { include: { brand: true, category: true } }, store: true },
      orderBy: { price: "asc" },
      take: 200,
    }),
  ]);

  // Ordena por maior desconto
  const sorted = offers
    .map((o) => ({ ...o, discount: percentOff(o.oldPrice, o.price) }))
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0))
    .slice(0, 40);

  const activeCat = catSlug ? categories.find((c) => c.slug === catSlug) : null;
  const crumbs = [
    { name: "Ofertas", href: "/ofertas/" },
    ...(activeCat ? [{ name: activeCat.name, href: `/ofertas/${catSlug}/` }] : []),
  ];

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          name: activeCat ? `Ofertas de ${activeCat.name}` : "Todas as ofertas",
          description: "Ofertas com desconto real comparado ao histórico de preços.",
          url: `/ofertas/${catSlug}`,
          items: sorted.map((o) => ({ name: o.product.name, url: `/${o.product.category.slug}/${o.product.brand.slug}/${o.product.slug}/` })),
          breadcrumbs: [{ name: "Início", path: "/" }, ...crumbs],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={crumbs} />
        <header className="mb-6">
          <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            <Tag className="size-8 text-brand-600" aria-hidden />
            {activeCat ? `Ofertas de ${activeCat.name}` : "Ofertas de hoje"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Ofertas ordenadas pelo desconto real — comparado ao preço anterior praticado pela loja, não a preços inflados. Verifique o histórico de preços de cada produto antes de comprar.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/ofertas/" className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${!catSlug ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}>
            Todas
          </Link>
          {categories.map((c) => (
            <Link key={c.slug} href={`/ofertas/${c.slug}/`} className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${catSlug === c.slug ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"}`}>
              {c.name}
            </Link>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
            Nenhuma oferta ativa nesta categoria no momento. Volte em breve ou <Link href="/ofertas-relampago/" className="font-bold text-brand-600 hover:underline">veja as ofertas relâmpago</Link>.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((o) => {
              const discount = percentOff(o.oldPrice, o.price);
              const href = `/${o.product.category.slug}/${o.product.brand.slug}/${o.product.slug}/`;
              return (
                <article key={o.id} className="group relative flex flex-wrap items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
                  <Link href={href} className="absolute inset-0 z-10" aria-label={o.product.name} tabIndex={-1} />
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                    <Image src={o.product.imageUrl ?? "/images/products/celulares.svg"} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                      {o.store.name} · {o.product.category.name}
                    </p>
                    <h2 className="line-clamp-1 text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{o.product.name}</h2>
                    <p className="mt-0.5 text-xs text-ink-400">Atualizado em {formatDate(o.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {o.couponCode && (
                      <span className="hidden items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-700 sm:inline-flex">
                        <BadgePercent className="size-3.5" aria-hidden /> {o.couponCode}
                      </span>
                    )}
                    <div className="text-right">
                      {o.oldPrice && <p className="text-xs text-ink-400 line-through">{formatBRL(o.oldPrice, 0)}</p>}
                      <p className="font-display text-lg font-extrabold text-ink-950">{formatBRL(o.price, 0)}</p>
                    </div>
                    {discount && <span className="rounded-lg bg-flash-500 px-2 py-1 text-sm font-extrabold text-white">-{discount}%</span>}
                    <span className="pointer-events-none relative z-20 inline-flex items-center gap-1 rounded-xl bg-ink-950 px-4 py-2.5 text-xs font-bold text-white transition-colors group-hover:bg-brand-600">
                      Ver oferta <ArrowUpRight className="size-3.5" aria-hidden />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
