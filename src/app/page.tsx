import Link from "next/link";
import { ArrowRight, BadgePercent, BellRing, Boxes, History, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { collectionJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/jsonld";
import { SearchBar } from "@/components/search-bar";
import { SectionHeading } from "@/components/section-heading";
import { DealCard, type DealCardData } from "@/components/deal-card";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";
import { FaqAccordion } from "@/components/faq-accordion";

export const metadata = buildMetadata({
  title: "Ofertas, preços e informações para você comprar melhor",
  description:
    "Compare produtos, descubra ofertas relâmpago e encontre as melhores opções antes de comprar. Fichas técnicas, histórico de preços, comparações e guias de compra atualizados.",
  path: "/",
});

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [deals, categories, featured, recent, comparisons, articles, coupons] = await Promise.all([
    prisma.deal.findMany({
      where: { status: "ACTIVE", endAt: { gt: new Date() } },
      orderBy: { endAt: "asc" },
      include: { product: { include: { brand: true, category: true } }, store: true },
    }).catch(() => []),
    prisma.category.findMany({
      where: { products: { some: {} } },
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    }).catch(() => []),
    prisma.product.findMany({
      where: { featured: true },
      include: { brand: true, category: true, offers: { include: { store: true }, orderBy: { price: "asc" } } },
    }).catch(() => []),
    prisma.product.findMany({
      where: { offers: { some: { active: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { brand: true, category: true, offers: { where: { active: true }, include: { store: true }, orderBy: { price: "asc" } } },
    }).catch(() => []),
    prisma.comparison.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: { include: { product: { include: { brand: true } } }, orderBy: { order: "asc" } } },
    }).catch(() => []),
    prisma.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 6,
      include: { author: true, category: true },
    }).catch(() => []),
    prisma.coupon.findMany({ where: { active: true }, include: { store: true }, take: 6, orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);

  const dealCards: DealCardData[] = deals.map((d) => ({
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

  const productCards: ProductCardData[] = featured.map((p) => ({
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    brandName: p.brand.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    bestOffer: p.offers[0]
      ? {
          price: p.offers[0].price,
          oldPrice: p.offers[0].oldPrice,
          couponCode: p.offers[0].couponCode,
          shipping: p.offers[0].shipping,
          storeName: p.offers[0].store.name,
        }
      : null,
  }));

  const recentCards: ProductCardData[] = recent.map((p) => ({
    name: p.name,
    slug: p.slug,
    imageUrl: p.imageUrl,
    brandName: p.brand.name,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    rating: p.rating,
    reviewCount: p.reviewCount,
    bestOffer: p.offers[0]
      ? {
          price: p.offers[0].price,
          oldPrice: p.offers[0].oldPrice,
          couponCode: p.offers[0].couponCode,
          shipping: p.offers[0].shipping,
          storeName: p.offers[0].store.name,
        }
      : null,
  }));

  const articleCards: ArticleCardData[] = articles.map((a) => ({
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    type: a.type,
    publishedAt: a.publishedAt,
    authorName: a.author?.name,
    categoryName: a.category?.name,
  }));

  const homeFaqs = [
    { question: "Como o Oferta Relâmpago encontra os preços?", answer: "Monitoramos diariamente os preços dos principais produtos nas maiores lojas online do Brasil (Amazon, Magazine Luiza, Mercado Livre, Casas Bahia, Kabum! e outras). Cada preço é registrado no histórico para você saber se a oferta é real." },
    { question: "O que é uma oferta relâmpago?", answer: "É uma promoção com tempo limitado — normalmente de 6 a 48 horas — em que a loja pratica um preço bem abaixo do histórico. Mostramos o desconto real comparado ao preço médio dos últimos 90 dias e o tempo restante." },
    { question: "As avaliações são reais?", answer: "Sim. Não criamos avaliações falsas. Nossas análises são escritas pela redação com base em testes e dados verificáveis, e as avaliações de usuários vêm de compradores reais." },
    { question: "Como funcionam os links de ofertas?", answer: "Todas as ofertas são verificadas pela nossa equipe. Preços e disponibilidade podem mudar a qualquer momento, por isso sempre confirmamos as informações diretamente com as lojas." },
    { question: "Os preços mostrados são garantidos?", answer: "Os preços são capturados diretamente das lojas e podem mudar a qualquer momento. Sempre confirme o valor final no site da loja antes de finalizar a compra." },
    { question: "Posso ser avisado quando um preço cair?", answer: "Sim! Em qualquer página de produto, crie um alerta de preço gratuito informando o valor desejado e seu e-mail ou WhatsApp. Vamos avisar você quando o produto atingir o preço." },
  ];

  return (
    <>
      <JsonLd data={[websiteJsonLd(), organizationJsonLd(), ...collectionJsonLd({ name: "Ofertas relâmpago", description: "Ofertas com desconto real e tempo limitado.", url: "/ofertas-relampago/", items: deals.map((d) => ({ name: d.product.name, url: `/${d.product.category.slug}/${d.product.brand.slug}/${d.product.slug}/` })), breadcrumbs: [{ name: "Início", path: "/" }] })]} />

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="pointer-events-none absolute -left-32 -top-32 size-[480px] rounded-full bg-brand-500/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 right-0 size-[420px] rounded-full bg-flash-500/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur-sm">
              <Zap className="size-3.5 fill-brand-400 text-brand-400" aria-hidden />
              {deals.length} ofertas relâmpago ativas agora
            </span>
            <h1 className="font-display mt-6 text-balance text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Ofertas, preços e informações para você{" "}
              <span className="bg-gradient-to-r from-brand-400 to-flash-400 bg-clip-text text-transparent">comprar melhor</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-300 sm:text-lg">
              Compare produtos, descubra ofertas e encontre as melhores opções antes de comprar.
            </p>
            <div className="mt-8 flex justify-center">
              <SearchBar large />
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: BadgePercent, label: "Preços comparados", sub: "nas maiores lojas" },
                { icon: History, label: "Histórico de 1 ano", sub: "para ofertas reais" },
                { icon: BellRing, label: "Alertas grátis", sub: "aviso quando cair" },
                { icon: ShieldCheck, label: "Sem avaliações falsas", sub: "conteúdo verificável" },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-sm">
                  <f.icon className="size-5 text-brand-400" aria-hidden />
                  <p className="mt-2 text-sm font-bold text-white">{f.label}</p>
                  <p className="text-xs text-ink-400">{f.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── OFERTAS RELÂMPAGO ───────────────────────────────────────────── */}
      {dealCards.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8" aria-labelledby="deals-heading">
          <SectionHeading
            title="🔥 Ofertas Relâmpago"
            subtitle="Descontos reais com tempo limitado. Quando o cronômetro zerar, o preço volta ao normal."
            href="/ofertas-relampago/"
            linkLabel="Ver todas"
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dealCards.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </section>
      )}

      {/* ─── OFERTAS RECENTES ──────────────────────────────────────────── */}
      {recentCards.length > 0 && (
        <section className="bg-white py-14" aria-labelledby="recent-heading">
          <SectionHeading title="⚡ Ofertas recentes" subtitle="Os produtos adicionados mais recentemente, com o melhor preço de cada um." href="/busca/" linkLabel="Ver catálogo" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {recentCards.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ─── CATEGORIAS ──────────────────────────────────────────────────── */}
      <section className="bg-white py-14" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading title="Explore por categoria" subtitle="Fichas técnicas, ofertas e comparações organizadas por tipo de produto." href="/busca/" linkLabel="Ver todos os produtos" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}/`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:shadow-card"
              >
                <div>
                  <p className="font-display text-sm font-bold text-ink-950 transition-colors group-hover:text-brand-700">{c.name}</p>
                  <p className="text-xs text-ink-400">{c._count.products} produtos</p>
                </div>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-ink-400 shadow-sm transition-all group-hover:bg-brand-500 group-hover:text-white">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUTOS EM DESTAQUE ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8" aria-labelledby="featured-heading">
        <SectionHeading title="Produtos em destaque" subtitle="Os produtos mais monitorados e comparados pelos nossos leitores." href="/busca/" linkLabel="Ver catálogo" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {productCards.map((p, i) => (
            <ProductCard key={p.slug} product={p} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ─── CUPONS ──────────────────────────────────────────────────────── */}
      {coupons.length > 0 && (
        <section className="bg-gradient-to-r from-brand-600 to-flash-600 py-10" aria-labelledby="coupons-heading">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 id="coupons-heading" className="font-display flex items-center gap-2 text-lg font-bold text-white">
                  <BadgePercent className="size-5" aria-hidden />
                  Cupons ativos
                </h2>
                <p className="text-sm text-white/80">Economize ainda mais copiando os cupons das lojas parceiras.</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {coupons.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
                    <p className="font-mono text-sm font-bold text-white">{c.code}</p>
                    <p className="text-[11px] text-white/70">{c.store.name} · {c.discount}</p>
                  </div>
                ))}
                <Link href="/cupons/" className="inline-flex items-center gap-1.5 self-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-flash-700 transition-transform hover:scale-105">
                  Ver todos <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── COMPARAÇÕES ─────────────────────────────────────────────────── */}
      {comparisons.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8" aria-labelledby="comparisons-heading">
          <SectionHeading title="Comparações que ajudam a decidir" subtitle="Colocamos os principais concorrentes lado a lado: preço, ficha técnica e veredito." href="/comparar/" linkLabel="Ver comparador" />
          <div className="grid gap-4 md:grid-cols-3">
            {comparisons.map((cmp) => (
              <Link
                key={cmp.id}
                href={`/comparar/${cmp.slug}/`}
                className="group rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover"
              >
                <div className="mb-4 flex items-center gap-2">
                  {cmp.items.map((item, i) => (
                    <span key={item.id} className="flex items-center gap-2">
                      <span className="grid size-10 place-items-center rounded-xl bg-ink-100 text-sm font-extrabold text-ink-700">
                        {item.product.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </span>
                      {i < cmp.items.length - 1 && <span className="text-xs font-black text-brand-500">VS</span>}
                    </span>
                  ))}
                </div>
                <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">{cmp.title}</h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-500">{cmp.intro}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── BLOG / GUIAS ────────────────────────────────────────────────── */}
      <section className="bg-white py-14" aria-labelledby="blog-heading">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <SectionHeading title="Guias e artigos para decidir melhor" subtitle="Conteúdo original, atualizado e baseado em dados reais de preço e especificação." href="/blog/" linkLabel="Ver blog" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articleCards.map((a) => (
              <ArticleCard key={a.slug} article={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-14 lg:px-8" aria-labelledby="faq-heading">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            <Sparkles className="size-3.5" aria-hidden />
            Perguntas frequentes
          </span>
          <h2 id="faq-heading" className="font-display mt-3 text-2xl font-bold tracking-tight text-ink-950">
            Como funciona o Oferta Relâmpago
          </h2>
        </div>
        <FaqAccordion items={homeFaqs} />
      </section>

      {/* ─── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-ink-950 px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">Não pague mais caro. Crie alertas de preço grátis.</h2>
            <p className="mt-1.5 text-sm text-ink-300">Escolha um produto, defina o preço desejado e receba o aviso na hora da queda.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/busca/" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600">
              <Boxes className="size-4" aria-hidden />
              Explorar produtos
            </Link>
            <Link href="/ofertas-relampago/" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
              <Zap className="size-4 fill-brand-400 text-brand-400" aria-hidden />
              Ver ofertas agora
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Compare preços, fichas técnicas e históricos antes de comprar. Dados atualizados diariamente.
        </p>
      </section>
    </>
  );
}
