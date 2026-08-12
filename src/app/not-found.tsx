import Link from "next/link";
import { SearchX } from "lucide-react";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center lg:px-8">
      <span className="font-display inline-grid size-20 place-items-center rounded-3xl bg-brand-50 text-4xl font-extrabold text-brand-500">404</span>
      <h1 className="font-display mt-6 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">Página não encontrada</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-600">
        O conteúdo que você procura pode ter sido movido, renomeado ou removido. Tente uma busca abaixo ou navegue pelas categorias.
      </p>
      <div className="mt-8 flex justify-center">
        <SearchBar placeholder="Busque o produto que procura..." />
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Link href="/" className="rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600">Ir para a Home</Link>
        <Link href="/ofertas/" className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-600">Ver ofertas</Link>
      </div>
    </div>
  );
}
