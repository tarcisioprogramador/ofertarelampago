import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATIC_PATHS = [
  "",
  "/ofertas/",
  "/ofertas-relampago/",
  "/comparar/",
  "/cupons/",
  "/blog/",
  "/guias/",
  "/busca/",
  "/sobre/",
  "/contato/",
  "/politica-de-privacidade/",
  "/termos-de-uso/",
  "/politica-editorial/",
  "/como-avaliamos/",
  "/como-funcionam-os-precos/",
  "/afiliados/",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, comparisons, articles] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, brand: { select: { slug: true } }, category: { select: { slug: true } }, updatedAt: true } }),
    prisma.category.findMany({ where: { products: { some: {} } }, select: { slug: true } }),
    prisma.comparison.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.article.findMany({ where: { published: true }, select: { slug: true, type: true, updatedAt: true } }),
  ]);

  const base = siteUrl("/");
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({ url: siteUrl(p), changeFrequency: "daily", priority: p === "" ? 1 : 0.6 }));

  for (const c of categories) {
    entries.push({ url: siteUrl(`/${c.slug}/`), changeFrequency: "daily", priority: 0.9 });
  }

  const brandPairs = new Set<string>();
  for (const p of products) {
    brandPairs.add(`${p.category.slug}/${p.brand.slug}`);
  }
  for (const pair of brandPairs) {
    entries.push({ url: siteUrl(`/${pair}/`), changeFrequency: "weekly", priority: 0.7 });
  }

  for (const p of products) {
    entries.push({
      url: siteUrl(`/${p.category.slug}/${p.brand.slug}/${p.slug}/`),
      changeFrequency: "daily",
      priority: 0.8,
      lastModified: p.updatedAt,
    });
  }

  for (const cmp of comparisons) {
    entries.push({ url: siteUrl(`/comparar/${cmp.slug}/`), changeFrequency: "weekly", priority: 0.7, lastModified: cmp.updatedAt });
  }

  for (const a of articles) {
    const basePath = a.type === "GUIDE" ? "/guias/" : "/blog";
    entries.push({ url: siteUrl(`${basePath}/${a.slug}/`), changeFrequency: "monthly", priority: 0.6, lastModified: a.updatedAt });
  }

  return entries;
}
