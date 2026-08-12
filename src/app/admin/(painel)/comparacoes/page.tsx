import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton } from "@/components/admin/ui";
import { createComparison, deleteComparison } from "@/lib/admin-actions";
import { ComparisonForm } from "@/components/admin/comparison-form";

export const dynamic = "force-dynamic";

export default async function AdminComparisonsPage() {
  const [comparisons, products] = await Promise.all([
    prisma.comparison.findMany({
      include: { items: { include: { product: { select: { name: true } } }, orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Comparações" subtitle="Páginas indexáveis de comparação curada." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Nova comparação</h2>
          <ComparisonForm products={products} saveAction={createComparison} />
        </AdminCard>

        <div className="space-y-3">
          {comparisons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{c.title}</p>
                <p className="text-xs text-ink-400">
                  /comparar/{c.slug}/ · {c.items.map((i) => i.product.name).join(" vs ")}
                </p>
              </div>
              <form action={deleteComparison.bind(null, c.id)}>
                <DangerButton />
              </form>
            </div>
          ))}
          {comparisons.length === 0 && <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-400">Nenhuma comparação criada.</p>}
        </div>
      </div>
    </>
  );
}
