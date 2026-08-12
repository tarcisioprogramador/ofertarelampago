import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, GitCompareArrows, Minus, Star, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { comparisonJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RatingStars } from "@/components/rating-stars";
import { formatBRL, affiliateUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<ReturnType<typeof buildMetadata>> {
  const { slug } = await params;
  const cmp = await prisma.comparison.findUnique({ where: { slug }, select: { title: true, seoDescription: true } });
  if (!cmp) return {};
  return buildMetadata({
    title: cmp.title,
    description: cmp.seoDescription ?? `${cmp.title}: comparação completa de preço, ficha técnica e avaliações.`,
    path: `/comparar/${slug}/`,
  });
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;

  const cmp = await prisma.comparison.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          product: {
            include: {
              brand: true,
              category: true,
              offers: { include: { store: true }, orderBy: { price: "asc" } },
              attributes: { include: { attribute: true } },
              pros: true,
            },
          },
        },
      },
    },
  });
  if (!cmp || cmp.items.length < 2) notFound();

  const products = cmp.items.map((i) => i.product);

  // Atributos em comum, ordenados pela primeira ocorrência
  const attrMap = new Map<string, { name: string; values: Map<string, string> }>();
  for (const p of products) {
    for (const a of p.attributes) {
      if (!attrMap.has(a.attribute.key)) attrMap.set(a.attribute.key, { name: a.attribute.name, values: new Map() });
      attrMap.get(a.attribute.key)!.values.set(p.id, a.value);
    }
  }
  const attrRows = [...attrMap.values()];

  const allPrices = products.map((p) => (p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : Infinity));
  const lowest = Math.min(...allPrices);

  const rowClass = (i: number) => (i % 2 ? "bg-ink-50/60" : "bg-white");

  return (
    <>
      <JsonLd
        data={comparisonJsonLd({
          title: cmp.title,
          description: cmp.intro ?? "",
          url: `/comparar/${cmp.slug}/`,
          items: products.map((p) => ({ name: p.name, url: `/${p.category.slug}/${p.brand.slug}/${p.slug}/`, image: p.imageUrl ?? "/images/products/celulares.svg" })),
          breadcrumbs: [
            { name: "Início", path: "/" },
            { name: "Comparar", path: "/comparar/" },
            { name: cmp.title, path: `/comparar/${cmp.slug}/` },
          ],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: "Comparar", href: "/comparar/" }, { name: cmp.title, href: `/comparar/${cmp.slug}/` }]} />

        <header className="mb-8 max-w-3xl">
          <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            <GitCompareArrows className="size-8 shrink-0 text-brand-600" aria-hidden />
            {cmp.title}
          </h1>
          {cmp.intro && <p className="mt-3 text-sm leading-relaxed text-ink-600">{cmp.intro}</p>}
          <p className="mt-2 text-xs text-ink-400">
            Comparação analisada pela redação do Oferta Relâmpago · Atualizada em {cmp.updatedAt.toLocaleDateString("pt-BR")}
          </p>
        </header>

        {/* Tabela de comparação */}
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50">
                <th className="w-44 px-4 py-4 text-xs font-bold uppercase tracking-wider text-ink-400">Produto</th>
                {products.map((p) => {
                  const price = p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : null;
                  const isLowest = price === lowest;
                  return (
                    <th key={p.id} className="px-4 py-4 align-top">
                      <Link href={`/${p.category.slug}/${p.brand.slug}/${p.slug}/`} className="group block">
                        <div className="relative mx-auto mb-2 h-28 w-28 overflow-hidden rounded-xl bg-white">
                          <Image src={p.imageUrl ?? "/images/products/celulares.svg"} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" sizes="112px" />
                        </div>
                        <p className="font-display text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{p.name}</p>
                      </Link>
                      <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-ink-500">
                        <RatingStars rating={p.rating} size={11} />
                        <span>{p.rating.toFixed(1)}</span>
                        <span>({p.reviewCount.toLocaleString("pt-BR")})</span>
                      </div>
                      {price && (
                        <p className="mt-1.5">
                          {isLowest && <span className="mr-1 rounded bg-emerald-500 px-1 py-px text-[9px] font-extrabold text-white">MELHOR PREÇO</span>}
                          <span className={`font-display text-base font-extrabold ${isLowest ? "text-emerald-600" : "text-ink-950"}`}>{formatBRL(price, 0)}</span>
                        </p>
                      )}
                      <a href={affiliateUrl(p.offers[0]?.url)} target="_blank" rel="noopener nofollow sponsored" className="mt-2 inline-flex items-center gap-1 rounded-lg bg-ink-950 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-brand-600">
                        Ver oferta <ArrowUpRight className="size-3" aria-hidden />
                      </a>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className={rowClass(0)}>
                <td className="px-4 py-3 font-semibold text-ink-600">Preço</td>
                {products.map((p) => {
                  const price = p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : null;
                  return <td key={p.id} className={`px-4 py-3 text-center font-bold ${price === lowest ? "text-emerald-600" : "text-ink-900"}`}>{price ? formatBRL(price, 0) : "—"}</td>;
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
                <td className="px-4 py-3 font-semibold text-ink-600">Nota</td>
                {products.map((p) => (
                  <td key={p.id} className="px-4 py-3 text-center">
                    <span className="font-display text-lg font-extrabold text-ink-950">{p.rating.toFixed(1)}</span>
                    <span className="text-xs text-ink-400"> / 5 · {p.reviewCount.toLocaleString("pt-BR")} avaliações</span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-[11px] text-ink-400">Comprando pelos links, podemos receber comissão sem custo para você. Preços podem variar a qualquer momento.</p>

        {/* Prós e contras de cada um */}
        <section className="mt-12">
          <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink-950 sm:text-2xl">Prós e contras de cada modelo</h2>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                <Link href={`/${p.category.slug}/${p.brand.slug}/${p.slug}/`} className="font-display font-bold text-ink-950 hover:text-brand-700">
                  {p.name}
                </Link>
                <ul className="mt-3 space-y-2">
                  {p.pros.filter((x) => x.type === "PRO").slice(0, 4).map((x) => (
                    <li key={x.id} className="flex items-start gap-2 text-sm text-ink-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden /> {x.text}
                    </li>
                  ))}
                  {p.pros.filter((x) => x.type === "CON").slice(0, 3).map((x) => (
                    <li key={x.id} className="flex items-start gap-2 text-sm text-ink-700">
                      <X className="mt-0.5 size-4 shrink-0 text-flash-500" aria-hidden /> {x.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Veredito */}
        <section className="mt-12 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50 p-6">
          <h2 className="font-display mb-2 flex items-center gap-2 text-lg font-bold text-ink-950">
            <Star className="size-5 fill-brand-500 text-brand-500" aria-hidden />
            Veredito da redação
          </h2>
          <p className="text-sm leading-relaxed text-ink-700">
            Compare os atributos que mais importam para o seu uso, o preço real nas lojas (use o histórico de preços de cada produto) e a nota dos usuários. Para a maioria dos perfis, o modelo com{" "}
            <strong className="text-ink-950">{products.find((p) => (p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : Infinity) === lowest)?.name}</strong> entrega o melhor equilíbrio entre preço e especificações nesta comparação. Antes de comprar, crie um alerta de preço e acompanhe o histórico dos últimos 90 dias.
          </p>
        </section>

        {/* Links internos */}
        <section className="mt-12">
          <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Páginas dos produtos desta comparação</h2>
          <div className="flex flex-wrap gap-2.5">
            {products.map((p) => (
              <Link key={p.id} href={`/${p.category.slug}/${p.brand.slug}/${p.slug}/`} className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-600">
                <Minus className="size-3.5 text-brand-500" aria-hidden />
                {p.name}
              </Link>
            ))}
            <Link href="/comparar/" className="inline-flex items-center gap-1.5 rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600">
              Criar outra comparação
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
