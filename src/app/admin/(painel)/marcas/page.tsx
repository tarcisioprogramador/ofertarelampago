import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton } from "@/components/admin/ui";
import { createBrand, deleteBrand } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <>
      <AdminPageHeader title="Marcas" subtitle="Cadastre novas marcas para usar nos produtos." />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Nova marca</h2>
          <form action={createBrand} className="space-y-3">
            <Field label="Nome *">
              <input required name="name" className={inputCls} placeholder="Xiaomi" />
            </Field>
            <Field label="Slug">
              <input name="slug" className={inputCls} placeholder="xiaomi" />
            </Field>
            <Field label="Descrição">
              <textarea name="description" rows={2} className={inputCls} />
            </Field>
            <Field label="Site">
              <input name="website" className={inputCls} placeholder="https://..." />
            </Field>
            <SubmitButton>Adicionar marca</SubmitButton>
          </form>
        </AdminCard>
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-bold">Marca</th>
                <th className="px-4 py-3 font-bold">Slug</th>
                <th className="px-4 py-3 font-bold">Produtos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink-900">{b.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500">{b.slug}</td>
                  <td className="px-4 py-3 text-ink-600">{b._count.products}</td>
                  <td className="px-4 py-3 text-right">
                    {b._count.products === 0 && (
                      <form action={deleteBrand.bind(null, b.id)} onSubmit={(e) => { if (!confirm("Excluir esta marca?")) e.preventDefault(); }}>
                        <DangerButton>Excluir</DangerButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
