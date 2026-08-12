import Link from "next/link";
import { CalendarClock, Flame, ShieldCheck, Timer, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { collectionJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DealCard, type DealCardData } from "@/components/deal-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { formatBRL } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Ofertas Relâmpago: descontos reais com tempo limitado",
  description: "Veja as ofertas relâmpago ativas agora com desconto real sobre o histórico de preços. Cada oferta tem cronômetro: quando zerar, o preço volta ao normal.",
  path: "/ofertas-relampago/",
});

export const dynamic = "force-dynamic";

export default async function FlashDealsPage() {
  const [active, upcoming, expiredCount] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "ACTIVE", endAt: { gt: new Date() } },
      orderBy: { endAt: "asc" },
      include: { product: { include: { brand: true, category: true } }, store: true },
    }),
    prisma.deal.count({ where: { status: "SCHEDULED" } }),
    prisma.deal.count({ where: { status: "EXPIRED" } }),
  ]);

  const avgDealPrice = active.length ? active.reduce((s, d) => s + d.price, 0) / active.length : 0;

  const cards: DealCardData[] = active.map((d) => ({
    id: d.id,
    title: d.title,
    endAt: d.endAt,
    oldPrice: d.oldPrice,
    price: d.price,
    couponCode: d.couponCode,
    storeName: d.store.name,
    productName: d.product.name,
    productSlug: d.product.slug,
    productImage: d.product.imageUrl,
    categorySlug: d.product.category.slug,
    brandSlug: d.product.brand.slug,
    rating: d.product.rating,
    reviewCount: d.product.reviewCount,
  }));

  const faqs = [
    { question: "O que é uma oferta relâmpago?", answer: "É uma promoção com duração limitada — normalmente de 6 a 48 horas — praticada pela loja em um preço bem abaixo do histórico. Mostramos o desconto real, comparado ao preço anterior, e um cronômetro com o tempo restante." },
    { question: "O desconto mostrado é real?", answer: "Sim. Calculamos o percentual sobre o preço anterior praticado pela própria loja (e não sobre o preço sugerido). Recomendamos sempre conferir o histórico de preços do produto para confirmar que o valor está no menor patamar." },
    { question: "E se a oferta expirar enquanto eu estou vendo?", answer: "Quando o cronômetro zera, a oferta sai automaticamente da lista de ofertas ativas. O produto continua com seu preço normal e você pode criar um alerta de preço para ser avisado na próxima queda." },
    { question: "Como saber se a oferta vale a pena?", answer: "Compare o preço relâmpago com o preço médio dos últimos 90 dias na página do produto. Se estiver abaixo da média e no menor patamar do período, é uma boa oferta." },
  ];

  return (
    <>
      <JsonLd
        data={collectionJsonLd({
          name: "Ofertas Relâmpago",
          description: "Ofertas com desconto real e tempo limitado.",
          url: "/ofertas-relampago/",
          items: active.map((d) => ({ name: d.product.name, url: `/${d.product.category.slug}/${d.product.brand.slug}/${d.product.slug}/` })),
          breadcrumbs: [{ name: "Início", path: "/" }, { name: "Ofertas Relâmpago", path: "/ofertas-relampago/" }],
        })}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <Breadcrumbs items={[{ name: "Ofertas Relâmpago", href: "/ofertas-relampago/" }]} />

        <header className="relative mb-10 overflow-hidden rounded-3xl bg-ink-950 px-6 py-10 sm:px-10">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-flash-500/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-brand-300">
              <Flame className="size-3.5 fill-brand-400 text-brand-400" aria-hidden />
              {active.length} ofertas ativas · {upcoming} agendada{upcoming === 1 ? "" : "s"}
            </span>
            <h1 className="font-display mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ofertas relâmpago <span className="text-flash-400">agora</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300">
              Descontos reais com tempo contado. Quando o cronômetro zerar, o preço volta ao normal — por isso mostramos o histórico de cada produto: você compra só quando a oferta é boa de verdade.
            </p>
            <div className="mt-6 flex flex-wrap gap-6 text-xs text-ink-300">
              {[
                { icon: Timer, label: "Cronômetro real baseado no fim da promoção" },
                { icon: ShieldCheck, label: "Desconto calculado sobre o preço anterior da loja" },
                { icon: CalendarClock, label: "Ofertas vencidas saem automaticamente da lista" },
              ].map((f) => (
                <span key={f.label} className="flex items-center gap-2">
                  <f.icon className="size-4 text-brand-400" aria-hidden /> {f.label}
                </span>
              ))}
            </div>
          </div>
        </header>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
            <Zap className="mx-auto size-10 text-ink-300" aria-hidden />
            <p className="font-display mt-4 text-lg font-bold text-ink-900">Nenhuma oferta relâmpago ativa no momento</p>
            <p className="mt-1 text-sm text-ink-500">Novas ofertas entram ao longo do dia. Cadastre um alerta de preço no produto desejado para não perder.</p>
            <Link href="/busca/" className="mt-5 inline-block rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600">
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        )}

        <section className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold text-ink-950">
              <Zap className="size-5 fill-brand-500 text-brand-500" aria-hidden />
              Como saber se a oferta é boa?
            </h2>
            <ol className="space-y-3 text-sm text-ink-600">
              <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">1</span> Abra a página do produto e veja o <strong className="text-ink-900">histórico de preço</strong> (30 dias, 90 dias, 6 meses, 1 ano).</li>
              <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">2</span> Compare o preço relâmpago com o <strong className="text-ink-900">preço médio do período</strong>.</li>
              <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">3</span> Se estiver no menor patamar, é oferta real. Some o frete e teste o <strong className="text-ink-900">cupom</strong> no checkout.</li>
              <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">4</span> Não era o que você queria? <Link href="/busca/" className="font-semibold text-brand-600 hover:underline">Continue buscando</Link> — oferta só é economia quando você precisa do produto.</li>
            </ol>
          </div>
          <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
            <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Perguntas frequentes</h2>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {active.length > 0 && (
          <p className="mt-10 text-center text-xs text-ink-400">
            Preço médio das ofertas relâmpago ativas: <strong className="text-ink-600">{formatBRL(avgDealPrice, 0)}</strong> — sempre compare antes de comprar.
          </p>
        )}
      </div>
    </>
  );
}
