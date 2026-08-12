import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug }, select: { name: true, seoDescription: true } });
  if (!cat) return {};
  return buildMetadata({
    title: `${cat.name}: artigos e guias`,
    description: cat.seoDescription ?? `Artigos e guias de ${cat.name}.`,
    path: `/blog/categoria/${slug}/`,
  });
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) notFound();

  const articles = await prisma.article.findMany({
    where: { published: true, categoryId: cat.id },
    orderBy: { publishedAt: "desc" },
    include: { author: true, category: true },
  });

  const cards: ArticleCardData[] = articles.map((a) => ({
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
      <Breadcrumbs items={[{ name: "Blog", href: "/blog/" }, { name: cat.name, href: `/blog/categoria/${cat.slug}/` }]} />
      <header className="mb-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{cat.name}</h1>
        <p className="mt-2 text-sm text-ink-500">{articles.length} conteúdos</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
      {articles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
          Nenhum conteúdo publicado ainda. <Link href="/blog/" className="font-bold text-brand-600 hover:underline">Ver todo o blog</Link>.
        </div>
      )}
    </div>
  );
}
