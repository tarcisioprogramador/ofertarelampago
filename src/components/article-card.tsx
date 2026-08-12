import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";

export type ArticleCardData = {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  type: string;
  publishedAt: Date;
  authorName?: string | null;
  categoryName?: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  GUIDE: "Guia de compra",
  NEWS: "Notícia",
  BLOG: "Artigo",
};

export function ArticleCard({ article, base = "/blog/" }: { article: ArticleCardData; base?: string }) {
  const href = `${base}/${article.slug}`;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover">
      <Link href={href} className="absolute inset-0 z-10" aria-label={article.title} tabIndex={-1} />
      <div className="relative h-40 overflow-hidden bg-ink-50">
        <Image src={article.coverImage ?? "/images/blog/produtos.svg"} alt={article.title} width={320} height={160} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-800 shadow-sm backdrop-blur-sm">
          {TYPE_LABEL[article.type] ?? article.type}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {article.categoryName && <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">{article.categoryName}</p>}
        <h3 className="mt-1 line-clamp-2 font-display text-[15px] font-bold leading-snug text-ink-950 transition-colors group-hover:text-brand-700">{article.title}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{article.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-ink-400">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden />
            {formatDate(article.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
            Ler
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}
