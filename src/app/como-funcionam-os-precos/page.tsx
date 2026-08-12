import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { COMO_PRECOS } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Como funcionam os preços",
  description: "Entenda como coletamos os preços, calculamos descontos e montamos o histórico de preços do Oferta Relâmpago.",
  path: "/como-funcionam-os-precos/",
});

export default function ComoPrecosPage() {
  return <StaticPage {...COMO_PRECOS} />;
}
