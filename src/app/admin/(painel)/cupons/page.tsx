import { prisma } from "@/lib/db";
import { AdminPageHeader, AdminCard, Field, inputCls, SubmitButton, DangerButton, Badge } from "@/components/admin/ui";
import { createCoupon, deleteCoupon } from "@/lib/admin-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const [stores, coupons] = await Promise.all([
    prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.coupon.findMany({ include: { store: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Cupons" subtitle="Cupons exibidos na página pública /cupons." />
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard>
          <h2 className="font-display mb-4 text-base font-bold text-ink-950">Novo cupom</h2>
          <form action={createCoupon} className="space-y-3">
            <Field label="Loja *">
              <select required name="storeId" className={inputCls}>
                <option value="">Selecione...</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Código *">
              <input required name="code" className={inputCls} placeholder="OFERTA10" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desconto">
                <input name="discount" className={inputCls} placeholder="10% off" />
              </Field>
              <Field label="Válido até">
                <input type="date" name="expiresAt" className={inputCls} />
              </Field>
            </div>
            <Field label="Descrição">
              <input name="description" className={inputCls} placeholder="10% em eletrônicos selecionados" />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" name="active" defaultChecked className="size-4 accent-brand-500" /> Ativo
            </label>
            <SubmitButton>Adicionar cupom</SubmitButton>
          </form>
        </AdminCard>
        <div className="space-y-3">
          {coupons.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <div>
                <p className="flex items-center gap-2 font-mono text-sm font-bold text-ink-900">{c.code} {c.active ? <Badge tone="green">ativo</Badge> : <Badge tone="red">inativo</Badge>}</p>
                <p className="text-xs text-ink-500">{c.store.name} · {c.description ?? ""} {c.expiresAt ? `· até ${formatDate(c.expiresAt)}` : ""}</p>
              </div>
              <form action={deleteCoupon.bind(null, c.id)}>
                <DangerButton />
              </form>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
