import Link from "next/link";
import { Logo } from "./logo";
import { prisma } from "@/lib/db";

export async function Footer() {
  const categories = await prisma.category.findMany({
    where: { products: { some: {} } },
    orderBy: { order: "asc" },
    select: { name: true, slug: true },
  });

  const institucional = [
    { href: "/sobre", label: "Sobre o Oferta Relâmpago" },
    { href: "/como-avaliamos/", label: "Como analisamos os produtos" },
    { href: "/como-funcionam-os-precos/", label: "Como funcionam os preços" },
    { href: "/contato", label: "Contato" },
    { href: "/afiliados", label: "Afiliados e parceiros" },
    { href: "/politica-editorial/", label: "Política editorial" },
    { href: "/politica-de-privacidade/", label: "Política de privacidade" },
    { href: "/termos-de-uso/", label: "Termos de uso" },
  ];

  const navegacao = [
    { href: "/ofertas-relampago/", label: "Ofertas relâmpago" },
    { href: "/ofertas", label: "Todas as ofertas" },
    { href: "/comparar", label: "Comparador de produtos" },
    { href: "/cupons", label: "Cupons de desconto" },
    { href: "/blog", label: "Blog" },
    { href: "/guias", label: "Guias de compra" },
    { href: "/busca/", label: "Buscar produtos" },
  ];

  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-500">
              Comparamos preços, fichas técnicas e avaliações para você tomar a melhor decisão de compra — sem pagar mais caro por isso.
            </p>
            <p className="text-xs text-ink-400">
              Os links de ofertas podem gerar comissão para o site, sem custo para você.{" "}
              <Link href="/afiliados/" className="underline underline-offset-2 hover:text-brand-600">
                Saiba mais
              </Link>
              .
            </p>
          </div>

          <div>
            <h3 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-ink-900">Categorias</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/${c.slug}/`} className="text-sm text-ink-600 transition-colors hover:text-brand-600">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-ink-900">Navegação</h3>
            <ul className="space-y-2.5">
              {navegacao.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-600 transition-colors hover:text-brand-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-ink-900">Institucional</h3>
            <ul className="space-y-2.5">
              {institucional.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-600 transition-colors hover:text-brand-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-100 pt-6 text-xs text-ink-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Oferta Relâmpago. Todos os direitos reservados.</p>
          <p>Preços verificados em {new Date().toLocaleDateString("pt-BR")}. Podem sofrer alteração a qualquer momento.</p>
        </div>
      </div>
    </footer>
  );
}
