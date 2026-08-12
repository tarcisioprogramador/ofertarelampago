import Link from "next/link";
import { Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArticleCard, type ArticleCardData } from "@/components/article-card";

export const metadata = buildMetadata({
  title: "Blog: notícias, ofertas e guias de compra",
  description: "Guias de compra, comparativos, notícias e dicas de produtos com base em dados reais de preço e especificações.",
  path: "/blog/",
});

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ autor?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const { autor } = await searchParams;
  const where = autor ? { published: true, author: { slug: autor } } : { published: true };

  const [articles, blogCategories, authors] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      include: { author: true, category: true },
      take: 18,
    }),
    prisma.article.findMany({ where: { published: true }, distinct: ["categoryId"], include: { category: true }, orderBy: { publishedAt: "desc" } }),
    prisma.author.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { articles: true } } } }),
  ]);

  const cats = blogCategories.map((a) => a.category).filter(Boolean);
  const [featured, ...rest] = articles;

  const toCard = (a: (typeof articles)[number]): ArticleCardData => ({
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    type: a.type,
    publishedAt: a.publishedAt,
    authorName: a.author?.name,
    categoryName: a.category?.name,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[{ name: "Blog", href: "/blog/" }]} />
      <header className="mb-8">
        <h1 className="font-display flex items-center gap-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
          <Newspaper className="size-8 text-brand-600" aria-hidden />
          Blog
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Guias de compra, comparativos, notícias e dicas — sempre baseados em dados reais de preço, ficha técnica e testes.
        </p>
      </header>

      {/* Categorias */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/blog/" className="rounded-full bg-ink-950 px-4 py-1.5 text-sm font-semibold text-white">
          Todos
        </Link>
        {cats.map((c) => c && (
          <Link key={c.slug} href={`/blog/categoria/${c.slug}/`} className="rounded-full bg-ink-100 px-4 py-1.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-200">
            {c.name}
          </Link>
        ))}
      </div>

      {/* Destaque */}
      {featured && (
        <Link href={`/blog/${featured.slug}/`} className="group mb-8 block overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
          <div className="grid md:grid-cols-2">
            <div className="relative h-56 md:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.coverImage ?? "/images/blog/produtos.svg"} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600">{featured.category?.name ?? "Destaque"}</p>
              <h2 className="font-display mt-3 text-xl font-extrabold leading-tight text-ink-950 transition-colors group-hover:text-brand-700 sm:text-2xl">{featured.title}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-600">{featured.excerpt}</p>
              <p className="mt-4 text-xs text-ink-400">
                {featured.author?.name} · {featured.publishedAt.toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rest.map((a) => (
          <ArticleCard key={a.slug} article={toCard(a)} />
        ))}
      </div>

      {/* Autores */}
      {!autor && (
        <section className="mt-14">
          <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Nossa equipe</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {authors.map((a) => (
              <div key={a.id} className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-flash-500 text-base font-extrabold text-white">
                    {a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-bold text-ink-950">{a.name}</p>
                    <p className="text-xs text-ink-400">{a.role ?? "Autor"} · {a._count.articles} conteúdos</p>
                  </div>
                </div>
                {a.specialty && <p className="mt-3 text-xs font-semibold text-brand-600">{a.specialty}</p>}
                <Link href={`/blog/?autor=${a.slug}`} className="mt-1 block text-xs text-ink-500 hover:text-brand-600">
                  Ver conteúdos →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
