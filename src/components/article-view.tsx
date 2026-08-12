import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, Clock3, UserRound } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { articleJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export function articleMetadata(article: { title: string; excerpt: string | null; slug: string; type: string; updatedAt: Date; coverImage: string | null }, base = "/blog/") {
  return buildMetadata({
    title: article.title,
    description: article.excerpt ?? article.title,
    path: `${base.replace(/\/+$/, "")}/${article.slug}/`,
    type: "article",
    modifiedTime: article.updatedAt.toISOString(),
    ogImage: article.coverImage ?? "/images/og-default.svg",
  });
}

type ArticleData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  type: string;
  coverImage: string | null;
  publishedAt: Date;
  updatedAt: Date;
  author?: { name: string; bio: string | null; specialty: string | null; role: string | null; slug: string } | null;
  category?: { name: string; slug: string } | null;
  products: { product: { id: string; name: string; slug: string; imageUrl: string | null; rating: number; reviewCount: number; brand: { name: string; slug: string }; category: { name: string; slug: string }; offers: { price: number; oldPrice: number | null; couponCode: string | null; shipping: string | null; store: { name: string } }[] } }[];
};

export function ArticleView({ article, base = "/blog/", backHref, backLabel }: { article: ArticleData; base?: string; backHref: string; backLabel: string }) {
  const href = `${base.replace(/\/+$/, "")}/${article.slug}/`;
  const cards: ProductCardData[] = article.products.map(({ product: p }) => ({
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

  const crumbs = [
    ...(base === "/blog/" ? [{ name: "Blog", href: "/blog/" }] : [{ name: "Guias", href: "/guias/" }]),
    ...(article.category ? [{ name: article.category.name, href: `/blog/categoria/${article.category.slug}/` }] : []),
    { name: article.title, href },
  ];

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: article.title,
          description: article.excerpt ?? article.title,
          url: href,
          image: article.coverImage ?? "/images/og-default.svg",
          publishedAt: article.publishedAt,
          updatedAt: article.updatedAt,
          author: article.author?.name ?? "Redação Oferta Relâmpago",
          section: article.category?.name ?? (article.type === "GUIDE" ? "Guias de compra" : "Blog"),
          breadcrumbs: [{ name: "Início", path: "/" }, ...crumbs],
        })}
      />

      <article className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={crumbs} />
        <Link href={backHref} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-600">
          <ArrowLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>

        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            {article.category && (
              <Link href={`/blog/categoria/${article.category.slug}/`} className="rounded-full bg-brand-50 px-3 py-1 font-bold text-brand-700 hover:bg-brand-100">
                {article.category.name}
              </Link>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden /> Publicado em {formatDate(article.publishedAt)}
            </span>
            {article.updatedAt.getTime() !== article.publishedAt.getTime() && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" aria-hidden /> Atualizado em {formatDate(article.updatedAt)}
              </span>
            )}
          </div>
          <h1 className="font-display mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink-950 sm:text-4xl">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-base leading-relaxed text-ink-600">{article.excerpt}</p>}
        </header>

        {article.coverImage && (
          <div className="relative mt-6 h-56 overflow-hidden rounded-3xl sm:h-72">
            <Image src={article.coverImage} alt={article.title} fill priority className="object-cover" sizes="(max-width: 896px) 100vw, 896px" />
          </div>
        )}

        <div className="prose-editorial mt-8">{renderMarkdown(article.content)}</div>

        {/* Autor */}
        {article.author && (
          <aside className="mt-10 flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:flex-row sm:items-center">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-flash-500 text-xl font-extrabold text-white">
              {article.author.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-400">
                <UserRound className="size-3.5" aria-hidden />
                {article.author.role ?? "Autor"} · {article.author.specialty ?? ""}
              </p>
              <p className="font-display mt-1 text-base font-bold text-ink-950">{article.author.name}</p>
              {article.author.bio && <p className="mt-1 text-sm leading-relaxed text-ink-600">{article.author.bio}</p>}
              <Link href={`/blog/?autor=${article.author.slug}`} className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:underline">
                Ver outros conteúdos deste autor
              </Link>
            </div>
          </aside>
        )}

        {/* Produtos citados */}
        {cards.length > 0 && (
          <section className="mt-12" aria-labelledby="cited-products">
            <h2 id="cited-products" className="font-display mb-4 text-lg font-bold text-ink-950">Produtos citados neste artigo</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {cards.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}

        <p className="mt-10 border-t border-ink-100 pt-6 text-xs leading-relaxed text-ink-400">
          Conteúdo original do Oferta Relâmpago. Preços e disponibilidade podem mudar — confira o valor atual na página de cada produto antes de comprar.
        </p>
      </article>
    </>
  );
}
