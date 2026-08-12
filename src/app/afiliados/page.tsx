import { AFILIADOS } from "@/lib/static-content";
import { StaticPage } from "@/components/static-page";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Afiliados e parceiros",
  description: "Como o Oferta Relâmpago se sustenta com links de afiliados sem comprometer a independência editorial.",
  path: "/afiliados/",
});

export default function AfiliadosPage() {
  return <StaticPage {...AFILIADOS} />;
}
