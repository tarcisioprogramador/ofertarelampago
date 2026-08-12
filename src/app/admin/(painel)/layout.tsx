import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/admin/logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/produtos/", label: "Produtos" },
  { href: "/admin/ofertas", label: "Ofertas" },
  { href: "/admin/ofertas-relampago", label: "Ofertas Relâmpago" },
  { href: "/admin/artigos/", label: "Artigos" },
  { href: "/admin/comparacoes", label: "Comparações" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/marcas", label: "Marcas" },
  { href: "/admin/lojas", label: "Lojas" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/afiliados", label: "Links de afiliado" },
  { href: "/admin/importar", label: "Importar do ML" },
  { href: "/admin/autores", label: "Autores" },
  { href: "/admin/alertas", label: "Alertas" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
      <aside className="shrink-0 lg:w-60">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card lg:sticky lg:top-24">
          <Logo />
          <nav className="mt-4 space-y-0.5" aria-label="Navegação do admin">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-ink-100 pt-3">
            <Link href="/" className="block rounded-lg px-3 py-2 text-xs font-semibold text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800">
              ← Ver o site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
