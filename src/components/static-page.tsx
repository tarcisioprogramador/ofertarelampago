import { Breadcrumbs } from "./breadcrumbs";
import { FaqAccordion, type FaqItem } from "./faq-accordion";

type Section = { title: string; body: string[]; bullets?: string[] };

export function StaticPage({ title, subtitle, sections, faqs, updatedAt }: { title: string; subtitle?: string; sections: Section[]; faqs?: FaqItem[]; updatedAt?: string }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <Breadcrumbs items={[{ name: title, href: "#" }]} />
      <header className="mb-8">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-relaxed text-ink-600">{subtitle}</p>}
        {updatedAt && <p className="mt-2 text-xs text-ink-400">Última atualização: {updatedAt}</p>}
      </header>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display mb-3 text-lg font-bold text-ink-950">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mb-3 text-sm leading-relaxed text-ink-600">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-2 space-y-2">
                {s.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-600">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {faqs && (
          <section>
            <h2 className="font-display mb-4 text-lg font-bold text-ink-950">Perguntas frequentes</h2>
            <FaqAccordion items={faqs} />
          </section>
        )}
      </div>
    </div>
  );
}
