import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { EDITORIAL } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Política Editorial",
  description: "Os princípios editoriais do Oferta Relâmpago: independência, verificabilidade e transparência.",
  path: "/politica-editorial/",
});

export default function EditorialPage() {
  return <StaticPage {...EDITORIAL} />;
}
