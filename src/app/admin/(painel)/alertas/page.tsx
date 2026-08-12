import { prisma } from "@/lib/db";
import { AdminPageHeader, Badge } from "@/components/admin/ui";
import { toggleAlert, deleteAlert } from "@/lib/admin-actions";
import { formatBRL, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const alerts = await prisma.priceAlert.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });

  return (
    <>
      <AdminPageHeader title="Alertas de preço" subtitle={`${alerts.length} alertas criados pelos visitantes.`} />
      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 font-bold">Produto</th>
              <th className="px-4 py-3 font-bold">Contato</th>
              <th className="px-4 py-3 font-bold">Preço desejado</th>
              <th className="px-4 py-3 font-bold">Criado em</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                <td className="px-4 py-3 font-semibold text-ink-900">{a.product.name}</td>
                <td className="px-4 py-3 text-ink-600">{a.email ?? a.whatsapp}</td>
                <td className="px-4 py-3 font-bold text-ink-900">{formatBRL(a.desiredPrice, 0)}</td>
                <td className="px-4 py-3 text-xs text-ink-400">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">{a.active ? <Badge tone="green">ativo</Badge> : <Badge tone="ink">pausado</Badge>}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <form action={toggleAlert.bind(null, a.id, !a.active)}>
                      <button className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-200">
                        {a.active ? "Pausar" : "Ativar"}
                      </button>
                    </form>
                    <form action={deleteAlert.bind(null, a.id)}>
                      <button className="rounded-lg bg-flash-50 px-3 py-1.5 text-xs font-bold text-flash-600 hover:bg-flash-100">Excluir</button>
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
