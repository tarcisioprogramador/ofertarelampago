import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateArticle } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const [article, authors, categories, products] = await Promise.all([
    prisma.article.findUnique({ where: { id }, include: { products: { select: { product: { select: { slug: true } } } } } }),
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  if (!article) notFound();

  return (
    <>
      <AdminPageHeader title={`Editar: ${article.title}`} back="/admin/artigos/" />
      <AdminCard>
        <ArticleForm
          authors={authors}
          categories={categories}
          products={products}
          saveAction={updateArticle.bind(null, article.id)}
          initial={{
            id: article.id,
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt ?? "",
            content: article.content,
            type: article.type,
            categoryId: article.categoryId ?? "",
            authorId: article.authorId ?? "",
            coverImage: article.coverImage ?? "/images/blog/produtos.svg",
            published: article.published,
            publishedAt: article.publishedAt.toISOString().slice(0, 10),
            seoTitle: article.seoTitle ?? "",
            seoDescription: article.seoDescription ?? "",
            productSlugs: article.products.map((p) => p.product.slug),
          }}
        />
      </AdminCard>
    </>
  );
}
