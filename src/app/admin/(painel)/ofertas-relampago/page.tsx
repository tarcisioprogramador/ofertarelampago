import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton, Badge } from "@/components/admin/ui";
import { createDeal, deleteDeal } from "@/lib/admin-actions";
import { formatBRL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDealsPage() {
  const [products, stores, deals] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.deal.findMany({
      include: { product: { select: { name: true } }, store: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  const statusTone = (s: string) => (s === "ACTIVE" ? "green" : s === "SCHEDULED" ? "amber" : "red");

  return (
    <>
      <AdminPageHeader title="Ofertas Relâmpago" subtitle="Campanhas com data de início e fim. Ofertas expiradas saem automaticamente das páginas públicas." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Nova campanha relâmpago</h2>
          <form action={createDeal} className="space-y-3">
            <Field label="Título">
              <input name="title" className={inputCls} placeholder="Galaxy A17 por R$ 1.099" />
            </Field>
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
              <Field label="Status">
                <select name="status" defaultValue="ACTIVE" className={inputCls}>
                  <option value="ACTIVE">Ativa</option>
                  <option value="SCHEDULED">Agendada</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço atual * (R$)">
                <input required type="number" step="0.01" name="price" className={inputCls} />
              </Field>
              <Field label="Preço anterior * (R$)">
                <input required type="number" step="0.01" name="oldPrice" className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Início *">
                <input required type="datetime-local" name="startAt" className={inputCls} />
              </Field>
              <Field label="Fim *">
                <input required type="datetime-local" name="endAt" className={inputCls} />
              </Field>
            </div>
            <Field label="URL do botão de compra *">
              <input required name="url" className={inputCls} placeholder="https://www.mercadolivre.com.br/..." />
            </Field>
            <Field label="Descrição">
              <textarea name="description" rows={3} className={inputCls} placeholder="Descreva a oferta em detalhes..." />
            </Field>
            <Field label="Tags (separadas por vírgula)">
              <input name="tags" className={inputCls} placeholder="celular, samsung, 5g, barato" />
            </Field>
            <Field label="URL da imagem">
              <input name="imageUrl" className={inputCls} placeholder="https://exemplo.com/foto.jpg ou /images/produto.svg" />
            </Field>
            <Field label="Cupom">
              <input name="couponCode" className={inputCls} placeholder="OFERTA10" />
            </Field>
            <SubmitButton>Criar campanha</SubmitButton>
          </form>
        </AdminCard>

        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3 font-bold">Produto</th>
                <th className="px-4 py-3 font-bold">Loja</th>
                <th className="px-4 py-3 font-bold">Preço</th>
                <th className="px-4 py-3 font-bold">Termina</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <tr key={d.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                  <td className="px-4 py-3 font-semibold text-ink-900">{d.product.name}</td>
                  <td className="px-4 py-3 text-ink-600">{d.store.name}</td>
                  <td className="px-4 py-3 font-bold text-flash-600">{formatBRL(d.price, 0)} <span className="text-xs font-normal text-ink-400 line-through">{formatBRL(d.oldPrice, 0)}</span></td>
                  <td className="px-4 py-3 text-xs text-ink-500">{formatDate(d.endAt, true)} {d.endAt < now ? <span className="text-flash-600">(vencida)</span> : null}</td>
                  <td className="px-4 py-3"><Badge tone={statusTone(d.status) as "green" | "amber" | "red"}>{d.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteDeal.bind(null, d.id)}>
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
