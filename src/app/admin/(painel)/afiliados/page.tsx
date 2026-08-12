import { AdminPageHeader, AdminCard, Badge } from "@/components/admin/ui";
import { AffiliateLinkGenerator } from "@/components/admin/affiliate-link-generator";
import { AffiliateLinksTable, type AffiliateOfferRow } from "@/components/admin/affiliate-links-table";
import { prisma } from "@/lib/db";
import { affiliateUrl, detectStore } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STORES = [
  {
    slug: "mercado-livre",
    name: "Mercado Livre",
    param: "matt_tool",
    example: "https://...?matt_tool=SEU_ID",
    env: process.env.MELI_AFFILIATE_ID,
  },
  {
    slug: "amazon",
    name: "Amazon Brasil",
    param: "tag",
    example: "https://amazon.com.br/dp/ASIN?tag=SEU-ID-21",
    env: process.env.AMAZON_AFFILIATE_TAG,
  },
  {
    slug: "magazine-luiza",
    name: "Magazine Luiza",
    param: "slug da loja",
    example: "https://parceiromagalu.com.br/SUA-LOJA/produto",
    env: process.env.MAGALU_AFFILIATE_SLUG,
  },
];

export default async function AdminAffiliateLinksPage() {
  const offers = await prisma.offer.findMany({
    include: { product: { select: { name: true, slug: true } }, store: { select: { name: true, slug: true } } },
    orderBy: { product: { name: "asc" } },
  });

  const rows: AffiliateOfferRow[] = offers.map((o) => {
    const store = detectStore(o.url);
    const affiliate = affiliateUrl(o.url);
    return {
      id: o.id,
      productName: o.product.name,
      productSlug: o.product.slug,
      store,
      storeName: o.store.name,
      price: o.price,
      url: o.url,
      affiliateUrl: affiliate,
      tracked: affiliate !== o.url,
    };
  });

  return (
    <>
      <AdminPageHeader title="Links de afiliado" subtitle="Gere links de afiliado para qualquer produto das lojas parceiras." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <AdminCard>
          <h2 className="font-display mb-1 text-base font-bold text-ink-950">Gerador de links</h2>
          <p className="mb-4 text-sm text-ink-500">Cole a URL de um produto e copie o link pronto com seu tracking de afiliado.</p>
          <AffiliateLinkGenerator />
        </AdminCard>

        <div className="space-y-4">
          <AdminCard className="p-5">
            <h3 className="font-display mb-3 text-sm font-bold text-ink-950">Status das lojas</h3>
            <ul className="space-y-3">
              {STORES.map((s) => (
                <li key={s.slug} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink-900">{s.name}</p>
                    {s.env ? <Badge tone="green">configurada</Badge> : <Badge tone="amber">sem ID</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-ink-400">
                    {s.env ? s.env : `parâmetro: ${s.param}`}
                  </p>
                </li>
              ))}
            </ul>
          </AdminCard>

          <AdminCard className="p-5">
            <h3 className="font-display mb-2 text-sm font-bold text-ink-950">Como funciona</h3>
            <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-ink-500">
              <li>Cole a URL do produto (Mercado Livre, Amazon ou Magalu).</li>
              <li>O sistema detecta a loja e aplica o parâmetro de afiliado automaticamente.</li>
              <li>Copie o link e use onde quiser — cada compra gera comissão.</li>
              <li>Para cadastrar IDs, edite o arquivo <code className="rounded bg-ink-100 px-1 font-mono text-[10px] text-ink-700">.env</code> e reinicie o servidor.</li>
            </ol>
          </AdminCard>
        </div>
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display mb-1 text-base font-bold text-ink-950">Links de todos os produtos</h2>
        <p className="mb-4 text-sm text-ink-500">Todos os links de afiliado das ofertas cadastradas — copie um a um ou todos de uma vez.</p>
        <AffiliateLinksTable offers={rows} />
      </AdminCard>
    </>
  );
}
