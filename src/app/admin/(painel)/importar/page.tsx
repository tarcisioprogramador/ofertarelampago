import { AdminPageHeader, AdminCard } from "@/components/admin/ui";
import { MeliImportForm } from "@/components/admin/meli-import-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const categories = await prisma.category.findMany({
    where: { products: { some: {} } },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  const meliId = process.env.MELI_AFFILIATE_ID;

  return (
    <>
      <AdminPageHeader title="Importar do Mercado Livre" subtitle="Cole seus links de afiliado e cadastre os produtos com o link de comissão automaticamente." />

      {!meliId && (
        <div className="mb-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⚠️ O ID de afiliado do Mercado Livre (<span className="font-mono">MELI_AFFILIATE_ID</span>) ainda não está configurado no <span className="font-mono">.env</span>. Os produtos serão importados, mas o botão de compra só renderizará seu link de afiliado depois que o ID for preenchido e o servidor reiniciado.
        </div>
      )}

      <AdminCard className="max-w-2xl">
        <h2 className="font-display mb-1 text-base font-bold text-ink-950">Importação em massa</h2>
        <p className="mb-4 text-sm text-ink-500">
          O sistema lê cada link <span className="font-mono">meli.la</span>, extrai nome, preço, imagem e cadastra o produto na categoria escolhida — com a URL real do produto, que vira seu link de afiliado automaticamente.
        </p>
        <MeliImportForm categories={categories} />
      </AdminCard>

      <AdminCard className="mt-6 max-w-2xl">
        <h3 className="font-display mb-2 text-sm font-bold text-ink-950">Como funciona</h3>
        <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-ink-500">
          <li>No painel de afiliados do ML, gere os links dos produtos que quer divulgar.</li>
          <li>Cole os links aqui (um por linha) e escolha a categoria.</li>
          <li>O sistema extrai os dados e cadastra cada produto com oferta do Mercado Livre.</li>
          <li>O botão "Ver oferta" do produto já direciona para o seu link de afiliado.</li>
        </ol>
      </AdminCard>
    </>
  );
}
