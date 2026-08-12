import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/utils";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Oferta Relâmpago",
    description: "Ofertas, preços e informações para você comprar melhor.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#ff6b00",
    icons: [{ src: "/images/logo.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
