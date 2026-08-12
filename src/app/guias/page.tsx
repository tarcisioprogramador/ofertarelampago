import Link from "next/link";
import { Compass } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";

export const metadata = buildMetadata({
  title: "Guias de compra: escolha o produto certo",
  description: "Guias de compra completos para celulares, notebooks, TVs, fones e mais. Aprenda a escolher com critério e economizar.",
  path: "/guias/",
});

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const [guides, categories] = await Promise.all([
    prisma.article.findMany({
      where: { published: true, type: "GUIDE" },
      orderBy: { publishedAt: "desc" },
      include: { author: true, category: true, products: { select: { product: { select: { name: true, slug: true, category: { select: { slug: true } }, brand: { select: { slug: true } } } } } } },
    }),
    prisma.category.findMany({ where: { products: { some: {} } }, orderBy: { order: "asc" }, select: { name: true, slug: true } }),
  ]);

  const cards: ArticleCardData[] = guides.map((a) => ({
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    type: a.type,
    publishedAt: a.publishedAt,
    authorName: a.author?.name,
    categoryName: a.category?.name,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[{ name: "Guias", href: "/guias/" }]} />
      <header className="mb-8">
        <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
          <Compass className="size-8 text-brand-600" aria-hidden />
          Guias de compra
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Guias práticos para você entender o que importa em cada categoria, definir o orçamento certo e comprar sem arrependimento.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {categories.map((c) => (
          <Link key={c.slug} href={`/${c.slug}/`} className="group rounded-2xl border border-ink-100 bg-white p-4 text-center shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
            <p className="font-display text-sm font-bold text-ink-950 group-hover:text-brand-700">{c.name}</p>
            <p className="text-xs text-ink-400">Ver produtos</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((a) => (
          <ArticleCard key={a.slug} article={a} base="/guias/" />
        ))}
      </div>
    </div>
  );
}
