import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { TERMOS } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Termos de Uso",
  description: "Termos e condições de uso do portal Oferta Relâmpago.",
  path: "/termos-de-uso/",
});

export default function TermosPage() {
  return <StaticPage {...TERMOS} />;
}
