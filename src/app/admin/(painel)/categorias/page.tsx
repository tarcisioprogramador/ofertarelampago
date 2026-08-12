import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton } from "@/components/admin/ui";
import { updateCategory, deleteCategory } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { products: { some: {} } },
    orderBy: { order: "asc" },
    include: {
      attributeDefs: { orderBy: { order: "asc" } },
      _count: { select: { products: true, faqs: true } },
    },
  });

  return (
    <>
      <AdminPageHeader title="Categorias" subtitle="Edite textos de introdução, SEO e veja os atributos dinâmicos de cada categoria." />
      <div className="space-y-5">
        {categories.map((c) => (
          <AdminCard key={c.id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-ink-950">/{c.slug}/ · {c.name}</h2>
                <p className="text-xs text-ink-400">
                  {c._count.products} produtos · {c._count.faqs} FAQs · {c.attributeDefs.length} atributos
                </p>
              </div>
              {c._count.products === 0 && (
                <form action={deleteCategory.bind(null, c.id)} onSubmit={(e) => { if (!confirm("Excluir esta categoria?")) e.preventDefault(); }}>
                  <DangerButton>Excluir</DangerButton>
                </form>
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {c.attributeDefs.map((a) => (
                <span key={a.id} className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                  {a.name}{a.filterable ? " ⚙" : ""}
                </span>
              ))}
            </div>
            <form action={updateCategory.bind(null, c.id)} className="grid gap-3 sm:grid-cols-2">
              <Field label="Descrição (resumo)">
                <textarea name="description" defaultValue={c.description ?? ""} rows={2} className={inputCls} />
              </Field>
              <Field label="Introdução (topo da página)">
                <textarea name="intro" defaultValue={c.intro ?? ""} rows={2} className={inputCls} />
              </Field>
              <Field label="SEO title">
                <input name="seoTitle" defaultValue={c.seoTitle ?? ""} className={inputCls} />
              </Field>
              <Field label="SEO description">
                <input name="seoDescription" defaultValue={c.seoDescription ?? ""} className={inputCls} />
              </Field>
              <div className="sm:col-span-2">
                <SubmitButton>Salvar {c.name}</SubmitButton>
              </div>
            </form>
          </AdminCard>
        ))}
      </div>
    </>
  );
}
