import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { collectionJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; brand: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<ReturnType<typeof buildMetadata>> {
  const { category, brand } = await params;
  const [cat, br] = await Promise.all([
    prisma.category.findUnique({ where: { slug: category }, select: { name: true } }),
    prisma.brand.findUnique({ where: { slug: brand }, select: { name: true } }),
  ]);
  if (!cat || !br) return {};
  return buildMetadata({
    title: `${br.name} ${cat.name}: modelos, preços e ofertas`,
    description: `Compare todos os modelos de ${br.name} de ${cat.name.toLowerCase()} com ficha técnica, avaliações e histórico de preços. Encontre as melhores ofertas.`,
    path: `/${category}/${brand}/`,
  });
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { category, brand } = await params;
  const sp = await searchParams;
  const page = typeof sp.pagina === "string" ? Number(sp.pagina) || 1 : 1;
  const perPage = 24;

  const [cat, br] = await Promise.all([
    prisma.category.findUnique({ where: { slug: category }, select: { name: true, slug: true } }),
    prisma.brand.findUnique({ where: { slug: brand }, select: { name: true, description: true } }),
  ]);
  if (!cat || !br) notFound();

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: { category: { slug: category }, brand: { slug: brand } },
      include: { brand: true, category: true, offers: { include: { store: true }, orderBy: { price: "asc" } } },
      orderBy: [{ featured: "desc" }, { rating: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where: { category: { slug: category }, brand: { slug: brand } } }),
  ]);
  const totalPages = Math.ceil(total / perPage);

  const cards: ProductCardData[] = products.map((p) => ({
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

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          name: `${br.name} ${cat.name}`,
          description: br.description ?? "",
          url: `/${category}/${brand}/`,
          items: products.map((p) => ({ name: p.name, url: `/${category}/${brand}/${p.slug}/` })),
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: cat.name, path: `/${cat.slug}/` },
            { name: br.name, path: `/${category}/${brand}/` },
          ],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: cat.name, href: `/${cat.slug}/` }, { name: br.name, href: `/${category}/${brand}/` }]} />
        <header className="mb-8">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            {br.name} {cat.name}
          </h1>
          {br.description && <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-600">{br.description}</p>}
          <p className="mt-3 text-xs text-ink-500">
            <span className="font-bold text-ink-900">{total}</span> modelos monitorados · <Link href={`/${cat.slug}/`} className="font-semibold text-brand-600 hover:underline">voltar para {cat.name.toLowerCase()}</Link>
          </p>
        </header>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <p className="font-display text-lg font-bold text-ink-900">Nenhum modelo encontrado</p>
            <Link href={`/${cat.slug}/`} className="mt-4 inline-block rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
              Ver todos os {cat.name.toLowerCase()}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {cards.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} basePath={`/${category}/${brand}/`} query={{ pagina: undefined }} />
      </div>
    </>
  );
}
