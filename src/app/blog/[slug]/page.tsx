import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArticleView, articleMetadata } from "@/components/article-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug }, select: { title: true, excerpt: true, slug: true, type: true, updatedAt: true, coverImage: true, published: true } });
  if (!article || !article.published) return {};
  return articleMetadata(article);
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: true,
      category: true,
      products: { include: { product: { include: { brand: true, category: true, offers: { include: { store: true }, orderBy: { price: "asc" }, take: 1 } } } } },
    },
  });
  if (!article || !article.published) notFound();

  return <ArticleView article={article} base="/blog/" backHref="/blog/" backLabel="Voltar para o blog" />;
}
