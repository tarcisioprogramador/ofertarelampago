import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { ContactForm } from "@/components/contact-form";
import { CONTATO } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Contato",
  description: "Fale com a equipe do Oferta Relâmpago: correção de dados, sugestões de produto, parcerias e imprensa.",
  path: "/contato/",
});

export default function ContatoPage() {
  return (
    <>
      <StaticPage {...CONTATO} />
      <div className="mx-auto max-w-4xl px-4 pb-16 lg:px-8">
        <ContactForm />
      </div>
    </>
  );
}
