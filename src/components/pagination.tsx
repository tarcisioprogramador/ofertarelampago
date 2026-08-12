import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages, basePath, query = {} }: { page: number; totalPages: number; basePath: string; query?: Record<string, string | undefined> }) {
  if (totalPages <= 1) return null;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v) params.set(k, v);
  }
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("pagina", String(p));
    else next.delete("pagina");
    const qs = next.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages: (number | "…")[] = [];
  const show = (p: number) => {
    if (p < 1 || p > totalPages || pages.includes(p)) return;
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) pages.push(p);
  };
  for (let p = 1; p <= totalPages; p++) show(p);

  return (
    <nav aria-label="Paginação" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className="grid size-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600" aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-ink-400">…</span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={`grid size-10 place-items-center rounded-xl text-sm font-semibold transition-colors ${
              p === page ? "bg-ink-950 text-white" : "border border-ink-200 bg-white text-ink-600 hover:border-brand-400 hover:text-brand-600"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link href={href(page + 1)} className="grid size-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-600" aria-label="Próxima página">
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
