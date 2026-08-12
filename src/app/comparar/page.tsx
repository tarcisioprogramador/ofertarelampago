import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, GitCompareArrows, ShoppingBag, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { comparisonJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareBuilder, type CompareOption } from "@/components/compare-builder";
import { RatingStars } from "@/components/rating-stars";
import { formatBRL, percentOff } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Comparador de produtos: compare preço e ficha técnica",
  description: "Compare celulares, notebooks, TVs e outros produtos lado a lado: preço, especificações, avaliações e histórico de preços.",
  path: "/comparar/",
});

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Tabela de comparação ad-hoc (produtos escolhidos por ?p=) */
async function LiveComparison({ slugs }: { slugs: string[] }) {
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    include: {
      brand: true,
      category: true,
      offers: { include: { store: true }, orderBy: { price: "asc" } },
      attributes: { include: { attribute: true } },
    },
  });
  if (products.length < 2) return null;

  // União ordenada de atributos (pela ordem da categoria do primeiro produto)
  const attrMap = new Map<string, { name: string; values: Map<string, string> }>();
  for (const p of products) {
    for (const a of p.attributes) {
      if (!attrMap.has(a.attribute.key)) {
        attrMap.set(a.attribute.key, { name: a.attribute.name, values: new Map() });
      }
      attrMap.get(a.attribute.key)!.values.set(p.id, a.value);
    }
  }
  const attrRows = [...attrMap.values()];

  const rowClass = (i: number) => (i % 2 ? "bg-ink-50/60" : "bg-white");
  const best = (prices: number[]) => Math.min(...prices);

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50">
            <th className="w-40 px-4 py-4 text-xs font-bold uppercase tracking-wider text-ink-400">Produto</th>
            {products.map((p) => (
              <th key={p.id} className="px-4 py-4 align-top">
                <Link href={`/${p.category.slug}/${p.brand.slug}/${p.slug}/`} className="group block">
                  <div className="relative mx-auto mb-2 h-24 w-24 overflow-hidden rounded-xl bg-white">
                    <Image src={p.imageUrl ?? "/images/products/celulares.svg"} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="96px" />
                  </div>
                  <p className="font-display text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{p.name}</p>
                </Link>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-ink-500">
                  <RatingStars rating={p.rating} size={11} />
                  <span>{p.rating.toFixed(1)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className={rowClass(0)}>
            <td className="px-4 py-3 font-semibold text-ink-600">Melhor preço</td>
            {products.map((p) => {
              const off = p.offers[0];
              const bestPrice = p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : null;
              const isLowest = bestPrice !== null && bestPrice === best(products.map((x) => (x.offers.length ? Math.min(...x.offers.map((o) => o.price)) : Infinity)));
              return (
                <td key={p.id} className={`px-4 py-3 text-center ${isLowest ? "bg-emerald-50/70" : ""}`}>
                  {off ? (
                    <>
                      <p className={`font-display text-lg font-extrabold ${isLowest ? "text-emerald-600" : "text-ink-950"}`}>{formatBRL(bestPrice, 0)}</p>
                      {isLowest && <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Menor preço</p>}
                      {off.oldPrice && <p className="text-xs text-ink-400 line-through">{formatBRL(off.oldPrice, 0)}</p>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
          {attrRows.map((row, i) => (
            <tr key={row.name} className={rowClass(i + 1)}>
              <td className="px-4 py-3 font-semibold text-ink-600">{row.name}</td>
              {products.map((p) => (
                <td key={p.id} className="px-4 py-3 text-center text-ink-800">{row.values.get(p.id) ?? "—"}</td>
              ))}
            </tr>
          ))}
          <tr className={rowClass(attrRows.length + 1)}>
            <td className="px-4 py-3 font-semibold text-ink-600">Avaliações</td>
            {products.map((p) => (
              <td key={p.id} className="px-4 py-3 text-center text-ink-800">
                {p.rating.toFixed(1)} <span className="text-xs text-ink-400">({p.reviewCount.toLocaleString("pt-BR")})</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const sp = await searchParams;
  const slugs = typeof sp.p === "string" ? [sp.p] : Array.isArray(sp.p) ? sp.p : [];

  if (slugs.length >= 2) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: "Comparador", href: "/comparar/" }, { name: "Comparação personalizada", href: `/comparar/?${slugs.map((s) => `p=${s}`).join("&")}` }]} />
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Comparação de produtos</h1>
        <p className="mt-2 text-sm text-ink-500">Comparação gerada a partir dos produtos selecionados. Para comparações curadas com análise da redação, veja as <Link href="/comparar/" className="font-semibold text-brand-600 hover:underline">comparações prontas</Link>.</p>
        <div className="mt-6">
          <LiveComparison slugs={slugs} />
        </div>
        <div className="mt-8">
          <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Comparações prontas da redação</h2>
          <CuratedComparisons compact />
        </div>
      </div>
    );
  }

  const [comparisons, allProducts] = await Promise.all([
    prisma.comparison.findMany({
      orderBy: { updatedAt: "desc" },
      include: { items: { include: { product: { include: { brand: true, category: true, offers: { include: { store: true }, orderBy: { price: "asc" } } } } }, orderBy: { order: "asc" } } },
    }),
    prisma.product.findMany({
      include: { brand: true, category: true, offers: { orderBy: { price: "asc" }, take: 1 } },
      orderBy: { name: "asc" },
    }),
  ]);

  const options: CompareOption[] = allProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    brandName: p.brand.name,
    categoryName: p.category.name,
    price: p.offers[0]?.price ?? null,
  }));

  return (
    <>
      <JsonLd
        data={comparisonJsonLd({
          title: "Comparações de produtos",
          description: "Comparações curadas de celulares, notebooks, TVs e mais.",
          url: "/comparar/",
          items: comparisons.flatMap((c) => c.items.map((i) => ({ name: i.product.name, url: `/${i.product.category.slug}/${i.product.brand.slug}/${i.product.slug}/`, image: i.product.imageUrl ?? "/images/products/celulares.svg" }))),
          breadcrumbs: [{ name: "Início", path: "/" }, { name: "Comparar", path: "/comparar/" }],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: "Comparar", href: "/comparar/" }]} />
        <header className="mb-8 max-w-3xl">
          <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            <GitCompareArrows className="size-8 text-brand-600" aria-hidden />
            Compare produtos antes de comprar
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            Colocamos preço, ficha técnica e avaliações lado a lado para você decidir com dados. Escolha de 2 a 4 produtos e monte sua própria comparação — ou veja as comparações analisadas pela nossa redação.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <CompareBuilder products={options} />
          <div>
            <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Comparações prontas da redação</h2>
            <div className="space-y-3">
              {comparisons.map((cmp) => (
                <Link key={cmp.id} href={`/comparar/${cmp.slug}/`} className="group block rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
                  <div className="mb-3 flex items-center gap-2">
                    {cmp.items.map((item, i) => (
                      <span key={item.id} className="flex items-center gap-2">
                        <span className="relative h-10 w-10 overflow-hidden rounded-xl bg-ink-100">
                          <Image src={item.product.imageUrl ?? "/images/products/celulares.svg"} alt="" fill className="object-cover" sizes="40px" />
                        </span>
                        {i < cmp.items.length - 1 && <span className="text-xs font-black text-brand-500">VS</span>}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-display line-clamp-2 text-sm font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">{cmp.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">{cmp.intro}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-600">
                    Abrir comparação <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function CuratedComparisons({ compact = false }: { compact?: boolean }) {
  const comparisons = await prisma.comparison.findMany({
    orderBy: { updatedAt: "desc" },
    include: { items: { include: { product: { include: { brand: true } } }, orderBy: { order: "asc" } } },
    take: 3,
  });
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {comparisons.map((cmp) => (
        <Link key={cmp.id} href={`/comparar/${cmp.slug}/`} className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
          <h3 className="font-display line-clamp-2 text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{cmp.title}</h3>
          <p className="mt-2 line-clamp-2 text-xs text-ink-500">{cmp.intro}</p>
        </Link>
      ))}
    </div>
  );
}
