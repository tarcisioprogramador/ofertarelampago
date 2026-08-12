import type { Metadata } from "next";
import { SITE_NAME, siteUrl } from "./utils";

type SeoInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
};

/** Gera Metadata completa: title, description, canonical, OG, Twitter, robots */
export function buildMetadata(seo: SeoInput): Metadata {
  const url = siteUrl(seo.path);
  const title = seo.title.length > 60 ? seo.title : `${seo.title} | ${SITE_NAME}`;
  const ogImage = seo.ogImage ?? "/images/og-default.svg";

  return {
    title,
    description: seo.description.slice(0, 160),
    alternates: { canonical: url },
    keywords: seo.keywords?.join(", "),
    robots: {
      index: !seo.noindex,
      follow: true,
      googleBot: { index: !seo.noindex, follow: true },
    },
    openGraph: {
      type: seo.type === "article" ? "article" : "website",
      locale: "pt_BR",
      url,
      siteName: SITE_NAME,
      title,
      description: seo.description.slice(0, 200),
      images: [{ url: siteUrl(ogImage), width: 1200, height: 630, alt: title }],
      ...(seo.publishedTime ? { publishedTime: seo.publishedTime } : {}),
      ...(seo.modifiedTime ? { modifiedTime: seo.modifiedTime } : {}),
      ...(seo.authors?.length ? { authors: seo.authors } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: seo.description.slice(0, 200),
      images: [siteUrl(ogImage)],
    },
  };
}
