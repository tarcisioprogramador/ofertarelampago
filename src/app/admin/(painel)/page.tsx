import Link from "next/link";
import { ArrowRight, BellRing, Boxes, CalendarClock, FileText, GitCompareArrows, Percent } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPageHeader, StatCard, Badge } from "@/components/admin/ui";
import { formatBRL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, offers, deals, articles, comparisons, alerts, coupons, recentAlerts, activeDeals, recentOffers] = await Promise.all([
    prisma.product.count(),
    prisma.offer.count(),
    prisma.deal.count({ where: { status: "ACTIVE" } }),
    prisma.article.count(),
    prisma.comparison.count(),
    prisma.priceAlert.count(),
    prisma.coupon.count({ where: { active: true } }),
    prisma.priceAlert.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { product: { select: { name: true, slug: true } } } }),
    prisma.deal.findMany({ where: { status: "ACTIVE" }, orderBy: { endAt: "asc" }, take: 5, include: { product: { select: { name: true } }, store: true } }),
    prisma.offer.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: { product: { select: { name: true, slug: true } }, store: true } }),
  ]);

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Visão geral da plataforma Oferta Relâmpago" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Produtos" value={products} icon={<Boxes className="size-4 text-brand-600" />} />
        <StatCard label="Ofertas" value={offers} icon={<Percent className="size-4 text-brand-600" />} />
        <StatCard label="Relâmpago ativas" value={deals} hint={`${activeDeals.length} em andamento`} icon={<CalendarClock className="size-4 text-flash-500" />} />
        <StatCard label="Artigos" value={articles} icon={<FileText className="size-4 text-brand-600" />} />
        <StatCard label="Comparações" value={comparisons} icon={<GitCompareArrows className="size-4 text-brand-600" />} />
        <StatCard label="Alertas ativos" value={alerts} icon={<BellRing className="size-4 text-brand-600" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {/* Alertas recentes */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink-950">Alertas de preço recentes</h2>
            <Link href="/admin/alertas" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {recentAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{a.product.name}</p>
                  <p className="text-xs text-ink-400">
                    {a.email ?? a.whatsapp} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={a.active ? "green" : "ink"}>{a.active ? "ativo" : "pausado"}</Badge>
                  <span className="font-display text-sm font-bold text-ink-900">{formatBRL(a.desiredPrice, 0)}</span>
                </div>
              </li>
            ))}
            {recentAlerts.length === 0 && <li className="py-6 text-center text-sm text-ink-400">Nenhum alerta ainda. Eles aparecem aqui quando visitantes criam alertas nas páginas de produto.</li>}
          </ul>
        </div>

        {/* Ofertas relâmpago em andamento */}
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink-950">Relâmpago em andamento</h2>
            <Link href="/admin/ofertas-relampago" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
              Gerenciar <ArrowRight className="size-3" />
            </Link>
          </div>
          <ul className="divide-y divide-ink-50">
            {activeDeals.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">{d.product.name}</p>
                  <p className="text-xs text-ink-400">Via {d.store.name} · termina {formatDate(d.endAt, true)}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-flash-600">{formatBRL(d.price, 0)}</p>
                  <p className="text-xs text-ink-400 line-through">{formatBRL(d.oldPrice, 0)}</p>
                </div>
              </li>
            ))}
            {activeDeals.length === 0 && <li className="py-6 text-center text-sm text-ink-400">Nenhuma oferta relâmpago ativa.</li>}
          </ul>
        </div>
      </div>

      {/* Ofertas recém-atualizadas */}
      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink-950">Ofertas recém-atualizadas</h2>
          <Link href="/admin/ofertas" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
            Gerenciar <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wider text-ink-400">
                <th className="py-2 pr-4 font-bold">Produto</th>
                <th className="py-2 pr-4 font-bold">Loja</th>
                <th className="py-2 pr-4 font-bold">Preço</th>
                <th className="py-2 pr-4 font-bold">De</th>
                <th className="py-2 font-bold">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {recentOffers.map((o) => (
                <tr key={o.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-ink-900">{o.product.name}</td>
                  <td className="py-2.5 pr-4 text-ink-600">{o.store.name}</td>
                  <td className="py-2.5 pr-4 font-bold text-ink-900">{formatBRL(o.price, 0)}</td>
                  <td className="py-2.5 pr-4 text-ink-400">{o.oldPrice ? formatBRL(o.oldPrice, 0) : "—"}</td>
                  <td className="py-2.5 text-xs text-ink-400">{formatDate(o.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
