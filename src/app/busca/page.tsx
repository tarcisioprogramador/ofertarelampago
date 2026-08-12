import Link from "next/link";
import { ArrowRight, Info, SearchX } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/jsonld";
import { collectionJsonLd } from "@/lib/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SearchBar } from "@/components/search-bar";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { findProducts, parseSearchIntent } from "@/lib/search";
import { formatBRL } from "@/lib/utils";
import { SortSelect } from "@/components/sort-select";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<ReturnType<typeof buildMetadata>> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") qs.set(k, v);
  return buildMetadata({
    title: q ? `Busca: ${q}` : "Buscar produtos, ofertas e fichas técnicas",
    description: q
      ? `Resultados para "${q}" com preços comparados nas principais lojas.`
      : "Busque por categoria, marca, preço ou características. Encontre o melhor preço antes de comprar.",
    path: `/busca${qs.toString() ? `?${qs}` : ""}`,
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = typeof sp.pagina === "string" ? Number(sp.pagina) || 1 : 1;

  const intent = q ? parseSearchIntent(q) : null;

  const brandParam = typeof sp.marca === "string" ? sp.marca : Array.isArray(sp.marca) ? sp.marca[0] : undefined;
  const categoryParam = typeof sp.categoria === "string" ? sp.categoria : undefined;
  const minPrice = typeof sp["preco-min"] === "string" ? Number(sp["preco-min"]) || undefined : undefined;
  const maxPrice = typeof sp["preco-max"] === "string" ? Number(sp["preco-max"]) || undefined : undefined;
  const sort = (typeof sp.ordenar === "string" ? sp.ordenar : undefined) as "relevance" | "price-asc" | "price-desc" | "rating" | "discount" | undefined;

  const [categories, brands, results] = await Promise.all([
    prisma.category.findMany({ where: { products: { some: {} } }, orderBy: { order: "asc" }, select: { name: true, slug: true } }),
    prisma.brand.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: "asc" } }),
    findProducts({ q, category: categoryParam, brand: brandParam, minPrice, maxPrice, sort, page, perPage: 24 }),
  ]);

  const cards: ProductCardData[] = results.items.map((p) => ({
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
          name: q ? `Resultados para "${q}"` : "Todos os produtos",
          description: "Resultados de busca com preços comparados.",
          url: `/busca${q ? `?q=${encodeURIComponent(q)}` : ""}`,
          items: results.items.map((p) => ({ name: p.name, url: `/${p.category.slug}/${p.brand.slug}/${p.slug}/` })),
          breadcrumbs: [{ name: "Início", path: "/" }, { name: "Busca", path: "/busca/" }],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: "Busca", href: "/busca/" }]} />

        <header className="mb-6 text-center">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {q ? `Resultados para "${q}"` : "Buscar produtos"}
          </h1>
          <div className="mt-5 flex justify-center">
            <SearchBar placeholder="celular Samsung até 1500 · notebook para estudar · TV 55 polegadas..." autoFocus={!q} />
          </div>
        </header>

        {/* Interpretação da busca */}
        {intent && (
          <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
              <Info className="size-4" aria-hidden /> Busca interpretada
            </p>
            <p className="mt-1.5 text-sm text-ink-700">
              {intent.keywords.length > 0 && <>Buscamos por <strong>{intent.keywords.join(", ")}</strong></>}
              {intent.maxPrice && <> · preço até <strong>{formatBRL(intent.maxPrice, 0)}</strong></>}
              {intent.minPrice && <> · a partir de <strong>{formatBRL(intent.minPrice, 0)}</strong></>}
              {"."}
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar de filtros */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">Categoria</h2>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/busca/" className={`block rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${!categoryParam ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"}`}>
                    Todas
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/busca?${new URLSearchParams({ ...(q ? { q } : {}), ...(categoryParam === c.slug ? {} : { categoria: c.slug }) }).toString()}`}
                      className={`block rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${categoryParam === c.slug ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-500">Marca</h2>
              <form method="get" className="space-y-1.5">
                {q && <input type="hidden" name="q" value={q} />}
                {categoryParam && <input type="hidden" name="categoria" value={categoryParam} />}
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {brands.map((b) => (
                    <label key={b.slug} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700 hover:text-brand-700">
                      <input type="checkbox" name="marca" value={b.slug} defaultChecked={brandParam === b.slug} className="size-4 rounded accent-brand-500" />
                      <span className="flex-1">{b.name}</span>
                      <span className="text-xs text-ink-400">{b._count.products}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <input type="number" name="preco-min" placeholder="Min R$" defaultValue={minPrice} className="w-full rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500" />
                  <input type="number" name="preco-max" placeholder="Máx R$" defaultValue={maxPrice} className="w-full rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-500" />
                </div>
                <button type="submit" className="w-full rounded-lg bg-ink-950 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600">
                  Aplicar filtros
                </button>
              </form>
            </div>
          </aside>

          {/* Resultados */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                <span className="font-bold text-ink-900">{results.total}</span> produtos encontrados
              </p>
              <SortSelect name="ordenar" options={sortOptions} defaultValue={sort} />
            </div>

            {results.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
                <SearchX className="mx-auto size-10 text-ink-300" aria-hidden />
                <p className="font-display mt-4 text-lg font-bold text-ink-900">Nenhum produto encontrado</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-ink-500">
                  Tente buscar por uma categoria, marca ou termo mais simples. Exemplos: <strong>celular Samsung até 1500</strong>, <strong>notebook para estudar</strong>, <strong>TV 55 polegadas</strong>.
                </p>
                <Link href="/busca/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
                  Ver todo o catálogo <ArrowRight className="size-4" aria-hidden />
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
              totalPages={results.totalPages}
              basePath="/busca/"
              query={{ q, marca: brandParam, categoria: categoryParam, "preco-min": minPrice?.toString(), "preco-max": maxPrice?.toString(), ordenar: sort }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
