import { buildMetadata } from "@/lib/seo";
import { StaticPage } from "@/components/static-page";
import { COMO_AVALIAMOS } from "@/lib/static-content";

export const metadata = buildMetadata({
  title: "Como analisamos os produtos",
  description: "Nossa metodologia de avaliação de produtos: critérios, processo de teste e transparência.",
  path: "/como-avaliamos/",
});

export default function ComoAvaliamosPage() {
  return <StaticPage {...COMO_AVALIAMOS} />;
}
