import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { SOBRE } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Sobre o Oferta Relâmpago",
  description: "Portal independente de ofertas, produtos e comparações. Conheça nossa missão, metodologia e princípios editoriais.",
  path: "/sobre/",
});

export default function SobrePage() {
  return <StaticPage {...SOBRE} />;
}
