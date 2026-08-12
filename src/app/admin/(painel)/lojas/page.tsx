import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, Badge } from "@/components/admin/ui";
import { createStore } from "@/lib/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminStoresPage() {
  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { offers: true, coupons: true } } },
  });

  return (
    <>
      <AdminPageHeader title="Lojas" subtitle="Lojas parceiras usadas nas ofertas e cupons." />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Nova loja</h2>
          <form action={createStore} className="space-y-3">
            <Field label="Nome *">
              <input required name="name" className={inputCls} placeholder="Amazon" />
            </Field>
            <Field label="Slug">
              <input name="slug" className={inputCls} placeholder="amazon" />
            </Field>
            <Field label="URL base">
              <input name="url" className={inputCls} placeholder="https://www.amazon.com.br" />
            </Field>
            <Field label="URL de afiliado (botão Comprar)">
              <input name="affiliateUrl" className={inputCls} placeholder="https://www.mercadolivre.com.br/social/fontenelle_413?..." />
            </Field>
            <Field label="Observação de frete">
              <input name="shippingNote" className={inputCls} placeholder="Frete grátis Prime" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="affiliateEnabled" className="size-4 accent-brand-500" /> Programa de afiliados
            </label>
            <SubmitButton>Adicionar loja</SubmitButton>
          </form>
        </AdminCard>
        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-bold">Loja</th>
                <th className="px-4 py-3 font-bold">Afiliado</th>
                <th className="px-4 py-3 font-bold">Link de afiliado</th>
                <th className="px-4 py-3 font-bold">Ofertas</th>
                <th className="px-4 py-3 font-bold">Cupons</th>
                <th className="px-4 py-3 font-bold">Frete</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3 font-semibold text-ink-900">{s.name}</td>
                  <td className="px-4 py-3">{s.affiliateEnabled ? <Badge tone="green">sim</Badge> : "—"}</td>
                  <td className="max-w-[240px] px-4 py-3 text-xs">
                    {s.affiliateUrl ? (
                      <a href={s.affiliateUrl} target="_blank" rel="noopener" className="inline-block max-w-full truncate font-mono text-brand-600 underline underline-offset-2 hover:text-brand-700" title={s.affiliateUrl}>
                        {s.affiliateUrl}
                      </a>
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s._count.offers}</td>
                  <td className="px-4 py-3 text-ink-600">{s._count.coupons}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{s.shippingNote ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
