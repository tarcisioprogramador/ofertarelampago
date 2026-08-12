import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPageHeader, Badge, DangerButton } from "@/components/admin/ui";
import { deleteProduct } from "@/lib/admin-actions";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : {},
    include: { brand: true, category: true, offers: { orderBy: { price: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <>
      <AdminPageHeader
        title="Produtos"
        subtitle={`${products.length} produtos (limite de 50 por listagem)`}
        action={
          <Link href="/admin/produtos/novo" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600">
            <Plus className="size-4" /> Novo produto
          </Link>
        }
      />

      <form method="get" className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <input name="q" defaultValue={q ?? ""} placeholder="Buscar produto..." className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-brand-500" />
        </div>
        <button className="rounded-xl bg-ink-950 px-4 text-sm font-bold text-white hover:bg-brand-600">Buscar</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wider text-ink-400">
              <th className="px-4 py-3 font-bold">Produto</th>
              <th className="px-4 py-3 font-bold">Categoria</th>
              <th className="px-4 py-3 font-bold">Preço</th>
              <th className="px-4 py-3 font-bold">Nota</th>
              <th className="px-4 py-3 font-bold">Destaque</th>
              <th className="px-4 py-3 text-right font-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-brand-50/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-400">{p.brand.name} · /{p.category.slug}/{p.brand.slug}/{p.slug}/</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{p.category.name}</td>
                <td className="px-4 py-3 font-bold text-ink-900">{p.offers[0] ? formatBRL(p.offers[0].price, 0) : "—"}</td>
                <td className="px-4 py-3">{p.rating.toFixed(1)}</td>
                <td className="px-4 py-3">{p.featured ? <Badge tone="green">destaque</Badge> : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/produtos/${p.id}`} className="rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-200">
                      Editar
                    </Link>
                    <form action={deleteProduct.bind(null, p.id)}>
                      <DangerButton />
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
