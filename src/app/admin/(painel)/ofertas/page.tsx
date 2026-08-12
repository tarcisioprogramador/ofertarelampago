import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton, Badge } from "@/components/admin/ui";
import { createOffer, deleteOffer } from "@/lib/admin-actions";
import { formatBRL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  const [products, stores, offers] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.offer.findMany({
      include: { product: { select: { name: true, slug: true } }, store: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <>
      <AdminPageHeader title="Ofertas" subtitle="Preços de cada produto em cada loja." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Nova oferta</h2>
          <form action={createOffer} className="space-y-3">
            <Field label="Produto *">
              <select required name="productId" className={inputCls}>
                <option value="">Selecione...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Loja *">
                <select required name="storeId" className={inputCls}>
                  <option value="">Loja</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Preço * (R$)">
                <input required type="number" step="0.01" name="price" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço anterior (R$)">
                <input type="number" step="0.01" name="oldPrice" className={inputCls} />
              </Field>
              <Field label="Cupom">
                <input name="couponCode" className={inputCls} placeholder="OFERTA10" />
              </Field>
            </div>
            <Field label="URL da oferta">
              <input name="url" className={inputCls} placeholder="https://loja.com.br/produto" />
            </Field>
            <Field label="Frete">
              <input name="shipping" className={inputCls} placeholder="Frete grátis" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="isBest" className="size-4 accent-brand-500" /> Melhor oferta do produto
            </label>
            <SubmitButton>Adicionar oferta</SubmitButton>
          </form>
        </AdminCard>

        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-bold">Produto</th>
                <th className="px-4 py-3 font-bold">Loja</th>
                <th className="px-4 py-3 font-bold">Preço</th>
                <th className="px-4 py-3 font-bold">De</th>
                <th className="px-4 py-3 font-bold">Cupom</th>
                <th className="px-4 py-3 font-bold">Atualizado</th>
                <th className="px-4 py-3 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                  <td className="px-4 py-3 font-semibold text-ink-900">{o.product.name}</td>
                  <td className="px-4 py-3 text-ink-600">{o.store.name}</td>
                  <td className="px-4 py-3 font-bold text-ink-900">{formatBRL(o.price, 0)}</td>
                  <td className="px-4 py-3 text-ink-400">{o.oldPrice ? formatBRL(o.oldPrice, 0) : "—"}</td>
                  <td className="px-4 py-3">{o.couponCode ? <Badge tone="green">{o.couponCode}</Badge> : "—"}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">{formatDate(o.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteOffer.bind(null, o.id)}>
                      <DangerButton />
                    </form>
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
