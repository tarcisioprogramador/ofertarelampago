import Link from "next/link";
import { BadgePercent, CalendarClock, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CouponCopy } from "@/components/coupon-copy";
import { formatDate, affiliateUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Cupons de desconto ativos nas lojas parceiras",
  description: "Cupons de desconto ativos em Amazon, Magazine Luiza, Kabum!, Casas Bahia e mais. Copie o código e economize na hora do checkout.",
  path: "/cupons/",
});

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    where: { active: true },
    include: { store: true },
    orderBy: { store: { name: "asc" } },
  });

  const stores = await prisma.store.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[{ name: "Cupons", href: "/cupons/" }]} />
      <header className="mb-8 max-w-2xl">
        <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
          <BadgePercent className="size-8 text-brand-600" aria-hidden />
          Cupons de desconto ativos
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          Copie o código, aplique no checkout da loja e economize ainda mais em cima das ofertas que já monitoramos. Os cupons são validados periodicamente pela nossa equipe.
        </p>
      </header>

      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
          Nenhum cupom ativo no momento. Confira as <Link href="/ofertas/" className="font-bold text-brand-600 hover:underline">ofertas do dia</Link>.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => (
            <article key={c.id} className="flex flex-col rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-lg bg-ink-950 px-2.5 py-1 text-xs font-bold text-white">{c.store.name}</span>
                {c.discount && <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-extrabold text-brand-700">{c.discount}</span>}
              </div>
              <h2 className="font-display text-sm font-bold text-ink-950">{c.description}</h2>
              {c.expiresAt && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                  <CalendarClock className="size-3.5" aria-hidden /> Válido até {formatDate(c.expiresAt)}
                </p>
              )}
              <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                <CouponCopy code={c.code} />
                <a href={affiliateUrl(c.url ?? c.store.url ?? "#")} target="_blank" rel="noopener nofollow sponsored" className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-700">
                  Ir para a loja <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="mt-14">
        <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Como usar os cupons</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: 1, title: "Copie o código", text: "Clique no código do cupom para copiá-lo automaticamente." },
            { n: 2, title: "Adicione o produto ao carrinho", text: "Escolha o produto monitorado e vá até o checkout da loja." },
            { n: 3, title: "Aplique no campo de cupom", text: "Cole o código no campo 'Cupom de desconto' e confirme o valor final." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <span className="font-display grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-flash-500 text-sm font-extrabold text-white">{s.n}</span>
              <h3 className="mt-3 font-bold text-ink-950">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
