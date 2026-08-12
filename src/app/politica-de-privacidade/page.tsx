import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { PRIVACIDADE } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Política de Privacidade",
  description: "Como o Oferta Relâmpago coleta, usa e protege seus dados pessoais.",
  path: "/politica-de-privacidade/",
});

export default function PrivacidadePage() {
  return <StaticPage {...PRIVACIDADE} />;
}
