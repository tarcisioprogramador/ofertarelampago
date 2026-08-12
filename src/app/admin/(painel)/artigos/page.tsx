import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPageHeader, Badge, DangerButton } from "@/components/admin/ui";
import { deleteArticle } from "@/lib/admin-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({
    include: { author: true, category: true },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });

  return (
    <>
      <AdminPageHeader
        title="Artigos"
        subtitle="Blog, guias e notícias."
        action={
          <Link href="/admin/artigos/novo" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600">
            <Plus className="size-4" /> Novo artigo
          </Link>
        }
      />
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 font-bold">Título</th>
              <th className="px-4 py-3 font-bold">Tipo</th>
              <th className="px-4 py-3 font-bold">Categoria</th>
              <th className="px-4 py-3 font-bold">Autor</th>
              <th className="px-4 py-3 font-bold">Publicado</th>
              <th className="px-4 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/artigos/${a.id}`} className="font-semibold text-ink-900 hover:text-brand-700">{a.title}</Link>
                  <p className="text-xs text-ink-400">{formatDate(a.publishedAt)}</p>
                </td>
                <td className="px-4 py-3"><Badge tone={a.type === "GUIDE" ? "amber" : "ink"}>{a.type}</Badge></td>
                <td className="px-4 py-3 text-ink-600">{a.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-ink-600">{a.author?.name ?? "—"}</td>
                <td className="px-4 py-3">{a.published ? <Badge tone="green">sim</Badge> : <Badge tone="red">rascunho</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/artigos/${a.id}`} className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-200">Editar</Link>
                    <form action={deleteArticle.bind(null, a.id)}>
                      <DangerButton />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
