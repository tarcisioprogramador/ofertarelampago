import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, SlidersHorizontal } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { collectionJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { FilterPanel } from "@/components/filter-panel";
import { Pagination } from "@/components/pagination";
import { FaqAccordion } from "@/components/faq-accordion";
import { SectionHeading } from "@/components/section-heading";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";
import { findProducts, getFilterOptions } from "@/lib/search";
import { truncate } from "@/lib/utils";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<ReturnType<typeof buildMetadata>> {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const cat = await prisma.category.findUnique({ where: { slug: category }, select: { name: true, seoTitle: true, seoDescription: true } });
  if (!cat) return {};
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  const path = qs.toString() ? `/${category}/?${qs}` : `/${category}/`;
  return buildMetadata({
    title: cat.seoTitle ?? `${cat.name}: ofertas e comparações`,
    description: cat.seoDescription ?? `Compare ${cat.name.toLowerCase()} por preço, ficha técnica e avaliações.`,
    path,
    noindex: qs.toString().length > 0 && !qs.get("pagina"),
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const sp = await searchParams;

  const [cat, brands, filterOptions] = await Promise.all([
    prisma.category.findUnique({ where: { slug: category }, include: { faqs: { orderBy: { order: "asc" } } } }),
    prisma.brand.findMany({
      where: { products: { some: { category: { slug: category } } } },
      include: { _count: { select: { products: { where: { category: { slug: category } } } } } },
      orderBy: { name: "asc" },
    }),
    getFilterOptions(category),
  ]);
  if (!cat) notFound();

  // Monta filtro a partir dos searchParams
  const attrs: Record<string, string[]> = {};
  const marca = sp.marca ? (Array.isArray(sp.marca) ? sp.marca : [sp.marca]) : undefined;
  for (const opt of filterOptions) {
    const v = sp[opt.key];
    if (v) attrs[opt.key] = Array.isArray(v) ? v : [v];
  }
  const priceBucket = typeof sp.preco === "string" && sp.preco.includes("-") ? sp.preco.split("-").map(Number) : null;

  const sort = typeof sp.ordenar === "string" ? (sp.ordenar as "relevance" | "price-asc" | "price-desc" | "rating" | "discount") : undefined;
  const page = typeof sp.pagina === "string" ? Number(sp.pagina) || 1 : 1;

  const { items, total, totalPages } = await findProducts({
    category,
    brand: marca?.[0],
    attributes: attrs,
    minPrice: priceBucket?.[0],
    maxPrice: priceBucket?.[1] === 99999999 ? undefined : priceBucket?.[1],
    sort,
    page,
    perPage: 24,
  });

  const [deals, articles, comparisons] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "ACTIVE", endAt: { gt: new Date() }, product: { category: { slug: category } } },
      include: { product: { include: { brand: true } }, store: true },
      take: 3,
    }),
    prisma.article.findMany({
      where: { published: true, products: { some: { product: { category: { slug: category } } } } },
      include: { author: true, category: true },
      take: 4,
      orderBy: { publishedAt: "desc" },
    }),
    prisma.comparison.findMany({
      where: { items: { some: { product: { category: { slug: category } } } } },
      include: { items: { include: { product: { include: { brand: true } } }, orderBy: { order: "asc" } } },
      take: 3,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const cards: ProductCardData[] = items.map((p) => ({
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    brandName: p.brand.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    bestOffer: p.offers[0]
      ? { price: p.offers[0].price, oldPrice: p.offers[0].oldPrice, couponCode: p.offers[0].couponCode, shipping: p.offers[0].shipping, storeName: p.offers[0].store.name }
      : null,
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

  const hasFilters = Object.keys(attrs).length > 0 || !!marca || !!priceBucket;

  const crumbs = [{ name: cat.name, href: `/${cat.slug}/` }];

  const sortOptions = [
    { value: "", label: "Mais relevantes" },
    { value: "price-asc", label: "Menor preço" },
    { value: "price-desc", label: "Maior preço" },
    { value: "rating", label: "Melhor avaliação" },
    { value: "discount", label: "Maior desconto" },
  ];

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          name: cat.name,
          description: cat.description ?? "",
          url: `/${cat.slug}/`,
          items: items.map((p) => ({ name: p.name, url: `/${cat.slug}/${p.brand.slug}/${p.slug}/` })),
          breadcrumbs: [{ name: "Início", path: "/" }, ...crumbs],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={crumbs} />
        <header className="mb-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{cat.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-600">{cat.intro ?? cat.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink-500">
            <span className="rounded-full bg-ink-100 px-3 py-1 font-semibold">{total} produtos monitorados</span>
            <Link href={`/ofertas/${cat.slug}/`} className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700 transition-colors hover:bg-brand-100">
              Ver ofertas →
            </Link>
            <Link href={`/comparar/`} className="rounded-full bg-ink-100 px-3 py-1 font-semibold text-ink-600 transition-colors hover:bg-ink-200">
              Comparar {cat.name.toLowerCase()}
            </Link>
          </div>
        </header>

        {/* Ofertas relâmpago da categoria */}
        {deals.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-3">
            {deals.map((d) => (
              <Link
                key={d.id}
                href={`/${cat.slug}/${d.product.brand?.slug ?? ""}/${d.product.slug}/`}
                className="group flex items-center gap-3 rounded-2xl border border-flash-500/30 bg-gradient-to-r from-flash-50 to-white p-3 pr-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-flash-600 to-flash-500 text-white">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-bold text-flash-700">Relâmpago</p>
                  <p className="text-sm font-semibold text-ink-900">{d.product.name}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Filtros */}
          <div className="hidden lg:block">
            <FilterPanel
              categoryPath={`/${cat.slug}/`}
              brands={brands.map((b) => ({ slug: b.slug, name: b.name, count: b._count.products }))}
              attributes={filterOptions.map((o) => ({ key: o.key, name: o.name, type: o.type, values: o.values }))}
            />
          </div>

          {/* Grid de produtos */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                <span className="font-bold text-ink-900">{total}</span> {cat.name.toLowerCase()} encontrados
                {hasFilters && <span className="text-ink-400"> com filtros aplicados</span>}
              </p>
              <SortSelect name="ordenar" options={sortOptions} defaultValue={sort} />
            </div>

            {/* Filtros mobile */}
            <details className="mb-5 rounded-2xl border border-ink-100 bg-white p-4 shadow-card lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
                <SlidersHorizontal className="size-4 text-brand-600" aria-hidden />
                Filtrar produtos
              </summary>
              <div className="mt-4">
                <FilterPanel categoryPath={`/${cat.slug}/`} brands={brands.map((b) => ({ slug: b.slug, name: b.name, count: b._count.products }))} attributes={filterOptions.map((o) => ({ key: o.key, name: o.name, type: o.type, values: o.values }))} />
              </div>
            </details>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
                <p className="font-display text-lg font-bold text-ink-900">Nenhum produto encontrado</p>
                <p className="mt-1 text-sm text-ink-500">Tente remover alguns filtros ou buscar por outra marca.</p>
                <Link href={`/${cat.slug}/`} className="mt-4 inline-block rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {cards.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath={`/${cat.slug}/`}
              query={{ marca: marca?.join(","), preco: typeof sp.preco === "string" ? sp.preco : undefined, ordenar: sort, ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, v.join(",")])) }}
            />
          </div>
        </div>

        {/* Comparações da categoria */}
        {comparisons.length > 0 && (
          <section className="mt-16" aria-labelledby="cmp-heading">
            <SectionHeading title={`Comparações de ${cat.name.toLowerCase()}`} href="/comparar/" linkLabel="Ver todas" />
            <div className="grid gap-4 md:grid-cols-3">
              {comparisons.map((cmp) => (
                <Link key={cmp.id} href={`/comparar/${cmp.slug}/`} className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
                  <h3 className="line-clamp-2 font-display text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{cmp.title}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-ink-500">{cmp.intro}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Artigos relacionados */}
        {articleCards.length > 0 && (
          <section className="mt-16" aria-labelledby="articles-heading">
            <SectionHeading title={`Guias e artigos de ${cat.name.toLowerCase()}`} href="/blog/" linkLabel="Ver blog" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {articleCards.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ da categoria */}
        {cat.faqs.length > 0 && (
          <section className="mt-16 max-w-3xl" aria-labelledby="cat-faq-heading">
            <h2 id="cat-faq-heading" className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">
              Perguntas frequentes sobre {cat.name.toLowerCase()}
            </h2>
            <FaqAccordion items={cat.faqs} />
          </section>
        )}

        {/* Texto SEO */}
        {cat.description && (
          <section className="mt-16 border-t border-ink-100 pt-8">
            <h2 className="font-display mb-3 text-lg font-bold text-ink-950">Sobre {cat.name.toLowerCase()}</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-ink-600">{truncate(cat.description, 900)}</p>
          </section>
        )}
      </div>
    </>
  );
}
