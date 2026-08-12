import { siteUrl } from "./utils";

type Crumb = { name: string; path?: string; href?: string };

function crumbPath(c: Crumb): string {
  return c.path ?? c.href ?? "/";
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: siteUrl(crumbPath(c)),
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Oferta Relâmpago",
    url: siteUrl("/"),
    logo: siteUrl("/images/logo.svg"),
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Oferta Relâmpago",
    url: siteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: siteUrl("/busca/?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

type ProductOffer = {
  price: number;
  oldPrice?: number | null;
  storeName: string;
  url: string;
  couponCode?: string | null;
  availability?: boolean;
  updatedAt?: Date;
};

export function productJsonLd(opts: {
  name: string;
  description: string;
  image: string;
  brand: string;
  category: string;
  url: string;
  offers: ProductOffer[];
  rating?: number;
  reviewCount?: number;
  reviews?: { author: string; rating: number; title?: string | null; content: string; date?: Date }[];
  breadcrumbs: Crumb[];
  faqs?: { question: string; answer: string }[];
}) {
  const offers = opts.offers.map((o) => ({
    "@type": "Offer",
    price: o.price.toFixed(2),
    priceCurrency: "BRL",
    url: o.url,
    availability: o.availability === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    seller: { "@type": "Organization", name: o.storeName },
    itemCondition: "https://schema.org/NewCondition",
    ...(o.oldPrice ? { priceValidUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) } : {}),
    ...(o.couponCode ? { description: `Use o cupom ${o.couponCode} no checkout` } : {}),
  }));

  const prices = opts.offers.map((o) => o.price);
  const hasOffers = prices.length > 0;

  const graph: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: opts.name,
      description: opts.description,
      image: [siteUrl(opts.image)],
      brand: { "@type": "Brand", name: opts.brand },
      category: opts.category,
      url: siteUrl(opts.url),
      ...(hasOffers
        ? {
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "BRL",
              lowPrice: Math.min(...prices).toFixed(2),
              highPrice: Math.max(...prices).toFixed(2),
              offerCount: prices.length,
              offers,
            },
          }
        : {}),
      ...(opts.rating && opts.rating > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: opts.rating.toFixed(1),
              bestRating: 5,
              ratingCount: opts.reviewCount ?? 0,
            },
          }
        : {}),
      ...(opts.reviews?.length
        ? {
            review: opts.reviews.map((r) => ({
              "@type": "Review",
              author: { "@type": "Person", name: r.author },
              reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
              ...(r.title ? { headline: r.title } : {}),
              reviewBody: r.content,
              datePublished: r.date ? new Date(r.date).toISOString() : undefined,
            })),
          }
        : {}),
    },
    breadcrumbJsonLd(opts.breadcrumbs),
    ...(opts.faqs?.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: opts.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]
      : []),
  ];
  return graph;
}

export function collectionJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
  breadcrumbs: Crumb[];
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: opts.name,
      description: opts.description,
      url: siteUrl(opts.url),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: opts.items.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          url: siteUrl(p.url),
        })),
      },
    },
    breadcrumbJsonLd(opts.breadcrumbs),
  ];
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: Date;
  updatedAt: Date;
  author: string;
  section: string;
  breadcrumbs: Crumb[];
  faqs?: { question: string; answer: string }[];
}) {
  const graph: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      image: [siteUrl(opts.image)],
      datePublished: new Date(opts.publishedAt).toISOString(),
      dateModified: new Date(opts.updatedAt).toISOString(),
      author: { "@type": "Person", name: opts.author },
      publisher: { "@type": "Organization", name: "Oferta Relâmpago", logo: { "@type": "ImageObject", url: siteUrl("/images/logo.svg") } },
      mainEntityOfPage: siteUrl(opts.url),
      articleSection: opts.section,
    },
    breadcrumbJsonLd(opts.breadcrumbs),
    ...(opts.faqs?.length
      ? [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: opts.faqs.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          },
        ]
      : []),
  ];
  return graph;
}

export function comparisonJsonLd(opts: { title: string; description: string; url: string; items: { name: string; url: string; image: string }[]; breadcrumbs: Crumb[] }) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: opts.title,
      description: opts.description,
      url: siteUrl(opts.url),
      numberOfItems: opts.items.length,
      itemListElement: opts.items.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          image: siteUrl(p.image),
          url: siteUrl(p.url),
        },
      })),
    },
    breadcrumbJsonLd(opts.breadcrumbs),
  ];
}
