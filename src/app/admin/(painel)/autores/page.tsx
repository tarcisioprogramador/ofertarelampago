import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { createAuthor } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminAuthorsPage() {
  const authors = await prisma.author.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { articles: true } } } });

  return (
    <>
      <AdminPageHeader title="Autores" subtitle="Biografias e especialidades exibidas nos artigos (E-E-A-T)." />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Novo autor</h2>
          <form action={createAuthor} className="space-y-3">
            <Field label="Nome *">
              <input required name="name" className={inputCls} placeholder="Ana Souza" />
            </Field>
            <Field label="Slug">
              <input name="slug" className={inputCls} placeholder="ana-souza" />
            </Field>
            <Field label="Função">
              <input name="role" className={inputCls} placeholder="Redatora-chefe" />
            </Field>
            <Field label="Especialidade">
              <input name="specialty" className={inputCls} placeholder="Celulares e notebooks" />
            </Field>
            <Field label="Biografia">
              <textarea name="bio" rows={3} className={inputCls} placeholder="Redatora de tecnologia há 8 anos..." />
            </Field>
            <SubmitButton>Adicionar autor</SubmitButton>
          </form>
        </AdminCard>
        <div className="space-y-3">
          {authors.map((a) => (
            <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-flash-500 font-bold text-white">
                {a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink-900">{a.name} <span className="text-xs font-normal text-ink-400">· {a._count.articles} artigos</span></p>
                <p className="text-xs text-ink-500">{a.role ?? "Autor"} {a.specialty ? `· ${a.specialty}` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
