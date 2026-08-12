import { prisma } from "@/lib/db";
import { createArticle } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/article-form";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
  const [authors, categories, products] = await Promise.all([
    prisma.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Novo artigo" back="/admin/artigos/" />
      <AdminCard>
        <ArticleForm authors={authors} categories={categories} products={products} saveAction={createArticle} />
      </AdminCard>
    </>
  );
}
