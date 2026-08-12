import { prisma } from "./db";

export type SearchIntent = {
  query: string;
  category?: string;
  brand?: string;
  maxPrice?: number;
  minPrice?: number;
  keywords: string[];
};

/** Extrai intenção da consulta: "celular samsung até 1500", "notebook para estudar", "TV 55 polegadas" */
export function parseSearchIntent(q: string): SearchIntent {
  const raw = q.trim();
  const lower = raw.toLowerCase();
  const intent: SearchIntent = { query: raw, keywords: [] };

  // "até R$ 1500" / "até 1500" / "ate 1500" / "até 1500 reais"
  const maxMatch = lower.match(/at[eé]?\s*(?:r\$\s*)?(\d[\d.\s]*)/);
  if (maxMatch) intent.maxPrice = Number(maxMatch[1].replace(/[\s.]/g, ""));
  const minMatch = lower.match(/(?:acima de|a partir de)\s*(?:r\$\s*)?(\d[\d.\s]*)/);
  if (minMatch) intent.minPrice = Number(minMatch[1].replace(/[\s.]/g, ""));

  // Palavras-chave: remove preços, preposições e artigos
  const stopwords = new Set([
    "o", "a", "os", "as", "um", "uma", "de", "da", "do", "das", "dos", "para", "por", "com", "até", "ate", "ateh",
    "até", "r$", "reais", "melhor", "melhores", "barato", "baratos", "custo", "benefício", "comprar", "me",
  ]);
  const keywords = lower
    .replace(/r\$\s*\d[\d.\s]*/g, "")
    .replace(/at[eé]?\s*\d[\d.\s]*/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));
  intent.keywords = keywords;

  return intent;
}

export type ProductFilter = {
  q?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  attributes?: Record<string, string[]>;
  sort?: "relevance" | "price-asc" | "price-desc" | "rating" | "discount";
  page?: number;
  perPage?: number;
};

export type ProductWithOffers = Awaited<ReturnType<typeof findProducts>>["items"][number];

/** Consulta de produtos com filtros dinâmicos, ordenação e paginação */
export async function findProducts(filter: ProductFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const perPage = filter.perPage ?? 24;
  const brand = filter.brand;
  const category = filter.category;

  const where: Record<string, unknown> = {
    ...(category ? { category: { slug: category } } : {}),
    ...(brand ? { brand: { slug: brand } } : {}),
    ...(filter.minPrice !== undefined || filter.maxPrice !== undefined
      ? { offers: { some: { price: { ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}), ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}) } } } }
      : {}),
  };

  // Filtros de atributos dinâmicos: cada chave vira uma condição AND de "tem algum valor em X"
  if (filter.attributes && Object.keys(filter.attributes).length > 0) {
    const attrConditions: Record<string, unknown>[] = [];
    for (const [key, values] of Object.entries(filter.attributes)) {
      if (!values?.length) continue;
      // LIKE parcial para que "6 GB" capture "8 GB"? Não — para filtros exatos usamos igualdade.
      attrConditions.push({ attribute: { key }, value: { in: values } });
    }
    if (attrConditions.length) where.AND = attrConditions;
  }

  // Busca por texto
  if (filter.q) {
    const intent = parseSearchIntent(filter.q);
    const nameTerms = intent.keywords;
    const or: Record<string, unknown>[] = [];
    for (const term of nameTerms) {
      or.push({ name: { contains: term } });
      or.push({ summary: { contains: term } });
      or.push({ brand: { name: { contains: term } } });
      or.push({ category: { name: { contains: term } } });
      or.push({ attributes: { some: { value: { contains: term } } } });
    }
    // Categoria/marca detectadas viram filtro explícito
    if (intent.category || intent.brand) {
      where.AND = [...(where.AND ? [where.AND] : []), ...(or.length ? [{ OR: or }] : []), ...(intent.category ? [{ category: { slug: intent.category } }] : []), ...(intent.brand ? [{ brand: { slug: intent.brand } }] : [])];
    } else if (or.length) {
      where.OR = or;
    }
    if (intent.maxPrice !== undefined || intent.minPrice !== undefined) {
      const priceWhere: Record<string, unknown> = {};
      if (intent.maxPrice !== undefined) priceWhere.lte = intent.maxPrice;
      if (intent.minPrice !== undefined) priceWhere.gte = intent.minPrice;
      where.AND = [...(where.AND ? [where.AND] : []), { offers: { some: { price: priceWhere } } }];
    }
  }

  let orderBy: Record<string, unknown> | Record<string, unknown>[] = { createdAt: "desc" };
  if (filter.sort === "price-asc") orderBy = { offers: { _count: "asc" } }; // placeholder trocado abaixo
  if (filter.sort === "price-desc") orderBy = { offers: { _count: "asc" } };
  if (filter.sort === "rating") orderBy = [{ rating: "desc" }, { reviewCount: "desc" }];
  if (filter.sort === "discount") orderBy = { offers: { _count: "asc" } };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        brand: true,
        category: true,
        offers: { include: { store: true }, orderBy: { price: "asc" } },
        attributes: { include: { attribute: true }, orderBy: { attribute: { order: "asc" } } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  // Ordenação por preço feita em memória (SQLite não ordena por relação facilmente)
  if (filter.sort === "price-asc" || filter.sort === "price-desc" || filter.sort === "discount") {
    const withPrice = items.map((p) => ({
      ...p,
      _minPrice: p.offers.length ? Math.min(...p.offers.map((o) => o.price)) : Number.MAX_SAFE_INTEGER,
      _bestDiscount: p.offers.length ? Math.max(...p.offers.map((o) => (o.oldPrice ? (o.oldPrice - o.price) / o.oldPrice : 0))) : 0,
    }));
    if (filter.sort === "price-asc") withPrice.sort((a, b) => a._minPrice - b._minPrice);
    if (filter.sort === "price-desc") withPrice.sort((a, b) => b._minPrice - a._minPrice);
    if (filter.sort === "discount") withPrice.sort((a, b) => b._bestDiscount - a._bestDiscount);
    return { items: withPrice, total, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

/** Gera as opções de filtro por atributo para uma categoria (a partir do que existe no banco) */
export async function getFilterOptions(categorySlug: string) {
  const defs = await prisma.attributeDefinition.findMany({
    where: { category: { slug: categorySlug }, filterable: true },
    orderBy: { order: "asc" },
    include: {
      values: {
        where: { product: { category: { slug: categorySlug } } },
        select: { value: true },
        distinct: ["value"],
        orderBy: { value: "asc" },
      },
    },
  });
  return defs.map((d) => ({ key: d.key, name: d.name, type: d.type, values: d.values.map((v) => v.value) }));
}

export const PRICE_BUCKETS = [
  { label: "Até R$ 500", min: 0, max: 500 },
  { label: "R$ 500 a R$ 1.000", min: 500, max: 1000 },
  { label: "R$ 1.000 a R$ 2.000", min: 1000, max: 2000 },
  { label: "R$ 2.000 a R$ 4.000", min: 2000, max: 4000 },
  { label: "Acima de R$ 4.000", min: 4000, max: 99999999 },
];
