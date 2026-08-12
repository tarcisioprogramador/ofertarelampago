"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { slugify, affiliateUrl, detectStore } from "./utils";
import { fetchMeliProduct } from "./meli-importer";
import { isAdmin } from "./admin";

async function guard() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function pick(data: FormData, key: string): string | null {
  const v = data.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pickNum(data: FormData, key: string): number | null {
  const v = pick(data, key);
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function pickBool(data: FormData, key: string): boolean {
  return data.get(key) === "on";
}

/** Salva a galeria de fotos de um produto (uma URL por linha). */
async function setProductGallery(productId: string, raw: string | null) {
  const urls = (raw ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((u) => u.startsWith("http"));
  await prisma.productImage.deleteMany({ where: { productId } });
  for (const [i, url] of urls.entries()) {
    await prisma.productImage.create({ data: { productId, url, order: i } });
  }
}

/** Cria/associa tags (separadas por vírgula ou quebra de linha) a um produto. */
async function setProductTags(productId: string, raw: string | null) {
  const names = (raw ?? "")
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  await prisma.productTag.deleteMany({ where: { productId } });
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    await prisma.productTag.create({ data: { productId, tagId: tag.id } });
  }
}

/** Salva tags, galeria, atributos dinâmicos e prós/contras de um produto (usado por create/update/IA). */
async function saveProductExtras(productId: string, categoryId: string, data: FormData) {
  await setProductTags(productId, pick(data, "tags"));
  await setProductGallery(productId, pick(data, "galleryImages"));

  const defs = await prisma.attributeDefinition.findMany({ where: { categoryId } });
  for (const def of defs) {
    const value = pick(data, `attr_${def.key}`);
    if (value) {
      await prisma.productAttributeValue.upsert({
        where: { productId_attributeId: { productId, attributeId: def.id } },
        create: { productId, attributeId: def.id, value },
        update: { value },
      });
    }
  }

  await prisma.prosCons.deleteMany({ where: { productId } });
  const pros = (pick(data, "pros") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const cons = (pick(data, "cons") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  for (const [i, text] of pros.entries()) await prisma.prosCons.create({ data: { productId, type: "PRO", text, order: i } });
  for (const [i, text] of cons.entries()) await prisma.prosCons.create({ data: { productId, type: "CON", text, order: i } });
}

// ─── Produtos ───────────────────────────────────────────────────────────────

export async function createProduct(data: FormData) {
  await guard();
  const name = pick(data, "name");
  const categoryId = pick(data, "categoryId");
  const brandId = pick(data, "brandId");
  if (!name || !categoryId || !brandId) throw new Error("Nome, categoria e marca são obrigatórios.");

  const slug = pick(data, "slug") || slugify(name);
  const product = await prisma.product.create({
    data: {
      name,
      slug,
      brandId,
      categoryId,
      summary: pick(data, "summary"),
      description: pick(data, "description"),
      imageUrl: pick(data, "imageUrl") ?? "/images/products/celulares.svg",
      releaseDate: pick(data, "releaseDate") ? new Date(pick(data, "releaseDate")!) : null,
      rating: pickNum(data, "rating") ?? 0,
      reviewCount: pickNum(data, "reviewCount") ?? 0,
      featured: pickBool(data, "featured"),
      isNew: pickBool(data, "isNew"),
      lastContentUpdate: new Date(),
    },
  });
  await saveProductExtras(product.id, categoryId, data);

  // Oferta (quando vier do link do Mercado Livre no formulário)
  const offerUrl = pick(data, "offerUrl");
  const offerPrice = pickNum(data, "offerPrice");
  const offerOldPrice = pickNum(data, "offerOldPrice");
  const store = await prisma.store.findUnique({ where: { slug: "mercado-livre" } });
  if (offerUrl && offerPrice && store) {
    await prisma.offer.create({
      data: {
        productId: product.id,
        storeId: store.id,
        price: offerPrice,
        oldPrice: offerOldPrice,
        url: offerUrl,
        shipping: "Frete grátis",
        isBest: true,
      },
    });
    await prisma.priceHistory.create({
      data: { productId: product.id, storeId: store.id, price: offerPrice, recordedAt: new Date() },
    });
  }

  // REGRA OBRIGATÓRIA: todo produto cadastrado ganha artigo de blog SEO (linkado à página do produto)
  const [category, brand] = await Promise.all([
    prisma.category.findUnique({ where: { id: categoryId } }),
    prisma.brand.findUnique({ where: { id: brandId } }),
  ]);
  if (category && brand) {
    await ensureProductArticle(product.id, {
      name,
      brand: brand.name,
      categoryId,
      categoryName: category.name,
      price: offerPrice,
      oldPrice: offerOldPrice,
      productUrl: offerUrl,
      categorySlug: category.slug,
      brandSlug: brand.slug,
      productSlug: slug,
    });
    if (offerPrice) {
      await ensureAutoComparison(product.id, { name, brand: brand.name, categoryId, categoryName: category.name, price: offerPrice });
    }
  }

  revalidatePath("/admin/produtos/");
  revalidatePath("/blog");
  revalidatePath("/comparar");
  revalidatePath("/");
  revalidatePath(`/${category?.slug}`);
  redirect("/admin/produtos/");
}

export async function updateProduct(id: string, data: FormData) {
  await guard();
  const name = pick(data, "name");
  const categoryId = pick(data, "categoryId");
  const brandId = pick(data, "brandId");
  if (!name || !categoryId || !brandId) throw new Error("Nome, categoria e marca são obrigatórios.");

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      slug: pick(data, "slug") || slugify(name),
      brandId,
      categoryId,
      summary: pick(data, "summary"),
      description: pick(data, "description"),
      imageUrl: pick(data, "imageUrl") ?? "/images/products/celulares.svg",
      releaseDate: pick(data, "releaseDate") ? new Date(pick(data, "releaseDate")!) : null,
      rating: pickNum(data, "rating") ?? 0,
      reviewCount: pickNum(data, "reviewCount") ?? 0,
      featured: pickBool(data, "featured"),
      isNew: pickBool(data, "isNew"),
      lastContentUpdate: new Date(),
    },
  });
  await saveProductExtras(id, categoryId, data);

  revalidatePath("/admin/produtos/");
  revalidatePath("/");
  redirect("/admin/produtos/");
}

export async function deleteProduct(id: string) {
  await guard();
  // Deleta registros relacionados primeiro (FK constraints)
  await prisma.priceHistory.deleteMany({ where: { productId: id } });
  await prisma.offer.deleteMany({ where: { productId: id } });
  await prisma.deal.deleteMany({ where: { productId: id } });
  await prisma.review.deleteMany({ where: { productId: id } });
  await prisma.productFAQ.deleteMany({ where: { productId: id } });
  await prisma.productTag.deleteMany({ where: { productId: id } });
  await prisma.productAttributeValue.deleteMany({ where: { productId: id } });
  await prisma.prosCons.deleteMany({ where: { productId: id } });
  await prisma.articleProduct.deleteMany({ where: { productId: id } });
  await prisma.comparisonItem.deleteMany({ where: { productId: id } });
  await prisma.productImage.deleteMany({ where: { productId: id } });
  await prisma.priceAlert.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/produtos/");
  revalidatePath("/");
}

// ─── Ofertas ─────────────────────────────────────────────────────────────────

export async function createOffer(data: FormData) {
  await guard();
  const productId = pick(data, "productId");
  const storeId = pick(data, "storeId");
  const price = pickNum(data, "price");
  if (!productId || !storeId || !price) throw new Error("Produto, loja e preço são obrigatórios.");

  await prisma.offer.create({
    data: {
      productId,
      storeId,
      price,
      oldPrice: pickNum(data, "oldPrice"),
      url: pick(data, "url") ?? "https://www.amazon.com.br",
      couponCode: pick(data, "couponCode"),
      shipping: pick(data, "shipping"),
      isBest: pickBool(data, "isBest"),
    },
  });
  revalidatePath("/admin/ofertas");
  revalidatePath("/");
  redirect("/admin/ofertas");
}

export async function deleteOffer(id: string) {
  await guard();
  await prisma.offer.delete({ where: { id } });
  revalidatePath("/admin/ofertas");
  revalidatePath("/");
}

// ─── Ofertas relâmpago ───────────────────────────────────────────────────────

export async function createDeal(data: FormData) {
  await guard();
  const productId = pick(data, "productId");
  const storeId = pick(data, "storeId");
  const price = pickNum(data, "price");
  const oldPrice = pickNum(data, "oldPrice");
  const startAt = pick(data, "startAt");
  const endAt = pick(data, "endAt");
  if (!productId || !storeId || !price || !oldPrice || !startAt || !endAt) throw new Error("Preencha todos os campos obrigatórios da oferta.");

  await prisma.deal.create({
    data: {
      title: pick(data, "title") ?? "Oferta relâmpago",
      description: pick(data, "description"),
      tags: pick(data, "tags"),
      productId,
      storeId,
      price,
      oldPrice,
      url: pick(data, "url") ?? "https://www.amazon.com.br/oferta-relampago",
      couponCode: pick(data, "couponCode"),
      imageUrl: pick(data, "imageUrl"),
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      status: pick(data, "status") ?? "ACTIVE",
    },
  });
  revalidatePath("/admin/ofertas-relampago");
  revalidatePath("/");
  revalidatePath("/ofertas-relampago/");
  redirect("/admin/ofertas-relampago");
}

export async function deleteDeal(id: string) {
  await guard();
  await prisma.deal.delete({ where: { id } });
  revalidatePath("/admin/ofertas-relampago");
  revalidatePath("/ofertas-relampago/");
  revalidatePath("/");
}

// ─── Artigos ─────────────────────────────────────────────────────────────────

export async function createArticle(data: FormData) {
  await guard();
  const title = pick(data, "title");
  const content = pick(data, "content");
  if (!title || !content) throw new Error("Título e conteúdo são obrigatórios.");

  const article = await prisma.article.create({
    data: {
      title,
      slug: pick(data, "slug") || slugify(title),
      excerpt: pick(data, "excerpt"),
      content,
      type: pick(data, "type") ?? "BLOG",
      categoryId: pick(data, "categoryId"),
      authorId: pick(data, "authorId"),
      coverImage: pick(data, "coverImage") ?? "/images/blog/produtos.svg",
      published: pickBool(data, "published"),
      publishedAt: pick(data, "publishedAt") ? new Date(pick(data, "publishedAt")!) : new Date(),
      seoTitle: pick(data, "seoTitle"),
      seoDescription: pick(data, "seoDescription"),
    },
  });

  await linkProducts(article.id, data);
  revalidatePath("/admin/artigos/");
  revalidatePath("/blog");
  revalidatePath("/guias");
  redirect("/admin/artigos/");
}

export async function updateArticle(id: string, data: FormData) {
  await guard();
  const title = pick(data, "title");
  const content = pick(data, "content");
  if (!title || !content) throw new Error("Título e conteúdo são obrigatórios.");

  await prisma.article.update({
    where: { id },
    data: {
      title,
      slug: pick(data, "slug") || slugify(title),
      excerpt: pick(data, "excerpt"),
      content,
      type: pick(data, "type") ?? "BLOG",
      categoryId: pick(data, "categoryId"),
      authorId: pick(data, "authorId"),
      coverImage: pick(data, "coverImage") ?? "/images/blog/produtos.svg",
      published: pickBool(data, "published"),
      publishedAt: pick(data, "publishedAt") ? new Date(pick(data, "publishedAt")!) : undefined,
      seoTitle: pick(data, "seoTitle"),
      seoDescription: pick(data, "seoDescription"),
    },
  });

  await prisma.articleProduct.deleteMany({ where: { articleId: id } });
  await linkProducts(id, data);
  revalidatePath("/admin/artigos/");
  revalidatePath("/blog");
  revalidatePath("/guias");
  redirect("/admin/artigos/");
}

async function linkProducts(articleId: string, data: FormData) {
  const slugs = data.getAll("productSlugs").filter((s): s is string => typeof s === "string" && s.length > 0);
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  for (const p of products) {
    await prisma.articleProduct.create({ data: { articleId, productId: p.id } });
  }
}

export async function deleteArticle(id: string) {
  await guard();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin/artigos/");
  revalidatePath("/blog");
  revalidatePath("/guias");
}

// ─── Comparações ─────────────────────────────────────────────────────────────

export async function createComparison(data: FormData) {
  await guard();
  const title = pick(data, "title");
  if (!title) throw new Error("Título é obrigatório.");
  const slug = pick(data, "slug") || slugify(title);
  const slugs = data.getAll("productSlugs").filter((s): s is string => typeof s === "string" && s.length > 0);

  const comparison = await prisma.comparison.create({
    data: {
      title,
      slug,
      intro: pick(data, "intro"),
      seoTitle: pick(data, "seoTitle"),
      seoDescription: pick(data, "seoDescription"),
    },
  });
  const products = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  for (const [i, p] of products.entries()) {
    await prisma.comparisonItem.create({ data: { comparisonId: comparison.id, productId: p.id, order: i } });
  }
  revalidatePath("/admin/comparacoes");
  revalidatePath("/comparar");
  redirect("/admin/comparacoes");
}

export async function deleteComparison(id: string) {
  await guard();
  await prisma.comparison.delete({ where: { id } });
  revalidatePath("/admin/comparacoes");
  revalidatePath("/comparar");
}

// ─── Categorias ──────────────────────────────────────────────────────────────

export async function updateCategory(id: string, data: FormData) {
  await guard();
  await prisma.category.update({
    where: { id },
    data: {
      description: pick(data, "description"),
      intro: pick(data, "intro"),
      seoTitle: pick(data, "seoTitle"),
      seoDescription: pick(data, "seoDescription"),
    },
  });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

export async function deleteCategory(id: string) {
  await guard();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categorias");
  revalidatePath("/");
}

// ─── Marcas ──────────────────────────────────────────────────────────────────

export async function createBrand(data: FormData) {
  await guard();
  const name = pick(data, "name");
  if (!name) throw new Error("Nome é obrigatório.");
  await prisma.brand.create({
    data: { name, slug: pick(data, "slug") || slugify(name), description: pick(data, "description"), website: pick(data, "website") },
  });
  revalidatePath("/admin/marcas");
  revalidatePath("/");
}

export async function deleteBrand(id: string) {
  await guard();
  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/marcas");
  revalidatePath("/");
}

// ─── Lojas, cupons, autores ──────────────────────────────────────────────────

export async function createStore(data: FormData) {
  await guard();
  const name = pick(data, "name");
  if (!name) throw new Error("Nome é obrigatório.");
  await prisma.store.create({
    data: {
      name,
      slug: pick(data, "slug") || slugify(name),
      url: pick(data, "url"),
      affiliateEnabled: pickBool(data, "affiliateEnabled"),
      affiliateUrl: pick(data, "affiliateUrl"),
      shippingNote: pick(data, "shippingNote"),
    },
  });
  revalidatePath("/admin/lojas");
}

export async function deleteStore(id: string) {
  await guard();
  await prisma.store.delete({ where: { id } });
  revalidatePath("/admin/lojas");
  revalidatePath("/");
}

export async function createCoupon(data: FormData) {
  await guard();
  const code = pick(data, "code");
  const storeId = pick(data, "storeId");
  if (!code || !storeId) throw new Error("Código e loja são obrigatórios.");
  await prisma.coupon.create({
    data: {
      code,
      storeId,
      description: pick(data, "description"),
      discount: pick(data, "discount"),
      url: pick(data, "url"),
      expiresAt: pick(data, "expiresAt") ? new Date(pick(data, "expiresAt")!) : null,
      active: pickBool(data, "active"),
    },
  });
  revalidatePath("/admin/cupons");
  revalidatePath("/cupons");
}

export async function deleteCoupon(id: string) {
  await guard();
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/cupons");
  revalidatePath("/cupons");
}

export async function createAuthor(data: FormData) {
  await guard();
  const name = pick(data, "name");
  if (!name) throw new Error("Nome é obrigatório.");
  await prisma.author.create({
    data: {
      name,
      slug: pick(data, "slug") || slugify(name),
      bio: pick(data, "bio"),
      specialty: pick(data, "specialty"),
      role: pick(data, "role"),
    },
  });
  revalidatePath("/admin/autores");
}

export async function deleteAuthor(id: string) {
  await guard();
  await prisma.author.delete({ where: { id } });
  revalidatePath("/admin/autores");
}

// ─── Importador de produtos do Mercado Livre ────────────────────────────────

export type ImportResult = {
  imported: number;
  skipped: number;
  failed: number;
  items: { name: string; status: "importado" | "ja-existia" | "erro"; url?: string; message?: string }[];
};

/** Gera tags SEO automáticas a partir do nome do produto, marca e categoria. */
function buildAutoTags(name: string, brand: string, categoryName: string): string[] {
  const words = name.toLowerCase().split(/\s+/);
  const tags = new Set<string>();
  tags.add(brand);
  tags.add(name);
  const firstWords = words.slice(0, 3).join(" ");
  if (firstWords !== name.toLowerCase()) tags.add(firstWords);
  if (words.length > 3) tags.add(words.slice(0, 2).join(" "));
  tags.add(categoryName);
  tags.add(`${brand} ${categoryName}`);
  return [...tags];
}

/** Cria (se ainda não existir) um artigo de blog informacional para o produto. */
/** Mapeia a categoria do produto para a imagem SVG de capa do blog. */
function blogCoverFor(categorySlug: string | null): string {
  if (!categorySlug) return "/images/blog/produtos.svg";
  const mapped: Record<string, string> = {
    celulares: "celulares",
    notebooks: "informatica-blog",
    "fones-de-ouvido": "tecnologia",
    smartwatches: "tecnologia",
    televisores: "tecnologia",
    tablets: "informatica-blog",
    games: "games-blog",
    eletrodomesticos: "casa",
    informatica: "informatica-blog",
  };
  return `/images/blog/${mapped[categorySlug] ?? "produtos"}.svg`;
}

async function ensureProductArticle(productId: string, data: { name: string; brand: string; categoryId: string | null; categoryName: string; price: number | null; oldPrice: number | null; productUrl: string | null; categorySlug: string; brandSlug: string; productSlug: string }): Promise<string | null> {
  const slug = `${slugify(data.name)}-e-bom`;
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) return null;

  const productPath = `/${data.categorySlug}/${data.brandSlug}/${data.productSlug}/`;
  const priceTxt = data.price ? `R$ ${data.price.toFixed(2).replace(".", ",")}` : null;
  const discountTxt = data.price && data.oldPrice && data.oldPrice > data.price
    ? ` O preço atual de **${priceTxt}** representa **${Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100)}% de desconto** em relação ao preço anterior de R$ ${data.oldPrice.toFixed(2).replace(".", ",")}.`
    : data.price
      ? ` O preço atual encontrado é de **${priceTxt}**.`
      : " Os preços variam conforme a loja e o momento — consulte as ofertas atuais na página do produto.";
  const cta = data.productUrl ? `[Confira a oferta atual do ${data.name}](${data.productUrl})` : `[Veja as ofertas do ${data.name}](${productPath})`;
  const priceFaq = data.price
    ? `O preço atual encontrado é de **${priceTxt}**. Os preços mudam com frequência — confira sempre a oferta mais recente.`
    : `O preço varia conforme a loja, a promoção e o momento da compra. Veja as [ofertas atuais do ${data.name}](${productPath}) para conferir o valor mais recente.`;

  const content = `# ${data.name} é bom? Veja preço, ficha técnica e se vale a pena

## O que é o ${data.name}?

O **${data.name}** é um produto da **${data.brand}**, da categoria **${data.categoryName}**. Nesta página reunimos os dados disponíveis sobre o produto, o preço atual e as melhores ofertas encontradas, para ajudar na sua decisão de compra.

## Preço e ofertas

${discountTxt}

Para quem busca economia, vale acompanhar o histórico de preços antes de comprar: o momento ideal é quando o valor está no menor patamar do período.

${cta}

## Principais características

- Produto: **${data.name}**
- Marca: **${data.brand}**
- Categoria: **${data.categoryName}**

> As especificações detalhadas (tela, memória, câmera, bateria etc.) estão na página oficial do produto, na ficha técnica do portal.

## Para quem vale a pena?

Este produto atende quem busca uma opção da categoria **${data.categoryName}** com bom custo-benefício. Como sempre, recomendamos comparar preços em mais de uma loja e verificar o histórico antes de fechar a compra.

## Alternativas e comparações

Na página do produto você encontra [produtos similares](${productPath}) na mesma categoria, além de comparações lado a lado de preço e especificações.

## Perguntas frequentes

### Quanto custa o ${data.name}?

${priceFaq}

### Onde comprar o ${data.name}?

O produto está disponível em lojas parceiras. Veja as [ofertas atuais](${productPath}) e escolha a melhor opção.

### O ${data.name} vale a pena?

O custo-benefício depende do preço praticado no momento e das suas necessidades. Acompanhe o histórico de preços para comprar no melhor momento.

## Conclusão

O **${data.name}** é uma opção real da categoria **${data.categoryName}**. Compare preços, acompanhe o histórico e compre quando o valor estiver no melhor patamar.`;

  return prisma.article
    .create({
      data: {
        title: `${data.name} é bom? Veja preço, ficha técnica e se vale a pena`,
        slug,
        excerpt: data.price
          ? `Análise do ${data.name} da ${data.brand}: preço atual (R$ ${data.price.toFixed(2).replace(".", ",")}), principais características, alternativas e se vale a pena comprar.`
          : `Análise do ${data.name} da ${data.brand}: principais características, benefícios, alternativas e se vale a pena comprar.`,
        content,
        type: "BLOG",
        categoryId: data.categoryId,
        coverImage: blogCoverFor(data.categorySlug),
        published: true,
        publishedAt: new Date(),
        seoTitle: `${data.name}: vale a pena? Preço, ficha técnica e ofertas`,
        seoDescription: `O ${data.name} é bom? Veja preço${data.price ? ` atual (R$ ${data.price.toFixed(2).replace(".", ",")})` : ""}, características, alternativas e se vale a pena comprar.`,
        products: { create: { productId } },
      },
    })
    .then(() => slug)
    .catch(() => null);
}

/** Cria uma comparação automática com produtos similares da mesma categoria (mesma marca ou faixa de preço próxima). */
async function ensureAutoComparison(productId: string, data: { name: string; brand: string; categoryId: string; categoryName: string; price: number }) {
  const competitors = await prisma.product.findMany({
    where: {
      categoryId: data.categoryId,
      NOT: { id: productId },
      offers: { some: {} },
    },
    include: { brand: true, offers: { orderBy: { price: "asc" } } },
    take: 50,
  });

  const scored = competitors
    .map((c) => {
      const sameBrand = c.brand.name.toLowerCase() === data.brand.toLowerCase() ? 3 : 0;
      const best = c.offers[0]?.price;
      const priceGap = best ? Math.abs(best - data.price) / data.price : 1;
      const priceScore = priceGap <= 0.35 ? 2 : 0;
      return { c, score: sameBrand + priceScore };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return;

  const picks = [productId, ...scored.slice(0, 2).map((s) => s.c.id)];
  const slug = `${slugify(data.name)}-vs-${slugify(scored[0].c.name)}`;
  const existing = await prisma.comparison.findUnique({ where: { slug } });
  if (existing) return;

  const shortName = data.name.replace(new RegExp(`^${data.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\s*`, "i"), "").trim() || data.name;
  const others = scored.slice(0, 2).map((s) => s.c.name.split(" ").slice(0, 2).join(" "));
  const title = `${data.brand} ${shortName} vs ${others.join(" e ")}`;

  const comparison = await prisma.comparison.create({
    data: {
      slug,
      title: title.slice(0, 120),
      intro: `Compare o ${data.name} com os principais concorrentes da categoria ${data.categoryName}: preço, especificações e custo-benefício lado a lado.`,
      seoTitle: `${title.slice(0, 110)}: qual comprar?`,
      seoDescription: `Compare ${data.name} com ${others.join(" e ")}: preço, ficha técnica e veredito para ajudar na sua decisão.`,
    },
  });
  for (const [i, id] of picks.entries()) {
    await prisma.comparisonItem.create({ data: { comparisonId: comparison.id, productId: id, order: i } });
  }
}

/** Detecta a marca pelo nome do produto (fallback: procura/usa marca existente). */
async function findBrandFor(name: string): Promise<string | null> {
  const known = [
    "Samsung", "Apple", "Xiaomi", "Motorola", "LG", "Acer", "Dell", "Lenovo",
    "JBL", "Brastemp", "Sony", "Nintendo", "Philips", "Logitech", "Intel", "AMD",
  ];
  const found = known.find((b) => name.toLowerCase().includes(b.toLowerCase()));
  if (found) return found;
  return null;
}

/** Importa produtos do Mercado Livre a partir de links de afiliado (meli.la/...). */
export async function importMeliProducts(data: FormData): Promise<ImportResult> {
  await guard();
  const rawLinks = (pick(data, "links") ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const categoryId = pick(data, "categoryId");
  const result: ImportResult = { imported: 0, skipped: 0, failed: 0, items: [] };

  if (!rawLinks.length) {
    result.failed = 1;
    result.items.push({ name: "Nenhum link informado", status: "erro", message: "Cole ao menos um link meli.la por linha." });
    return result;
  }
  if (!categoryId) {
    result.failed = 1;
    result.items.push({ name: "Categoria não informada", status: "erro", message: "Selecione a categoria dos produtos." });
    return result;
  }

  const store = await prisma.store.findUnique({ where: { slug: "mercado-livre" } });
  if (!store) {
    result.failed = 1;
    result.items.push({ name: "Loja não encontrada", status: "erro", message: "Cadastre a loja Mercado Livre antes de importar." });
    return result;
  }

  for (const link of rawLinks) {
    const data = await fetchMeliProduct(link);
    if (!data) {
      result.failed++;
      result.items.push({ name: link, status: "erro", message: "Não foi possível extrair os dados deste link." });
      continue;
    }

    const slug = slugify(data.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      result.skipped++;
      result.items.push({ name: data.name, status: "ja-existia", url: data.productUrl });
      continue;
    }

    const brandName = (await findBrandFor(data.name)) ?? "Samsung";
    const brand =
      (await prisma.brand.findUnique({ where: { slug: slugify(brandName) } })) ??
      (await prisma.brand.create({ data: { name: brandName, slug: slugify(brandName) } }));

    const category = await prisma.category.findUnique({ where: { id: categoryId } });

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        brandId: brand.id,
        categoryId,
        summary: `Produto encontrado no Mercado Livre. Preço atual: R$ ${data.price.toFixed(2).replace(".", ",")}.`,
        description: `Importado do Mercado Livre com link de afiliado. Monitore o histórico de preço e crie um alerta para ser avisado quando o valor cair.`,
        imageUrl: data.imageUrl,
        rating: 0,
        reviewCount: 0,
        isNew: true,
        featured: true,
        lastPriceCheck: new Date(),
        lastStockCheck: new Date(),
        lastContentUpdate: new Date(),
        offers: {
          create: {
            storeId: store.id,
            price: data.price,
            oldPrice: data.oldPrice,
            url: data.productUrl,
            shipping: "Frete grátis",
            isBest: true,
          },
        },
      },
    });

    await prisma.priceHistory.create({
      data: { productId: product.id, storeId: store.id, price: data.price, recordedAt: new Date() },
    });

    // Tags SEO automáticas
    await setProductTags(product.id, buildAutoTags(data.name, brand.name, category?.name ?? "").join(", "));

    // Artigo de blog automático + comparação com similares
    const articleSlug = await ensureProductArticle(product.id, {
      name: data.name,
      brand: brand.name,
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? "",
      price: data.price,
      oldPrice: data.oldPrice,
      productUrl: data.productUrl,
      categorySlug: category?.slug ?? "",
      brandSlug: brand.slug,
      productSlug: slug,
    });
    await ensureAutoComparison(product.id, {
      name: data.name,
      brand: brand.name,
      categoryId,
      categoryName: category?.name ?? "",
      price: data.price,
    });

    result.imported++;
    result.items.push({
      name: data.name,
      status: "importado",
      url: data.productUrl,
      message: [articleSlug ? `artigo: /blog/${articleSlug}/` : null].filter(Boolean).join(" · ") || undefined,
    });
  }

  revalidatePath("/admin/produtos/");
  revalidatePath("/admin/afiliados");
  revalidatePath("/blog");
  revalidatePath("/comparar");
  revalidatePath("/");
  return result;
}

// ─── Gerador de links de afiliado ────────────────────────────────────────────

export type AffiliateLinkResult = {
  input: string;
  output: string;
  store: "mercado-livre" | "amazon" | "magazine-luiza" | null;
  tracked: boolean;
  message: string;
};

export async function generateAffiliateLink(data: FormData): Promise<AffiliateLinkResult> {
  await guard();
  const input = pick(data, "url") ?? "";
  if (!input) {
    return { input: "", output: "", store: null, tracked: false, message: "Cole a URL do produto para gerar o link." };
  }

  const store = detectStore(input);
  if (!store) {
    return { input, output: input, store, tracked: false, message: "Loja não reconhecida — o link foi mantido como está. Confira se a URL é de uma loja parceira." };
  }

  const output = affiliateUrl(input);
  const tracked = output !== input;
  return {
    input,
    output,
    store,
    tracked,
    message: tracked ? "Tracking de afiliado aplicado com sucesso!" : "Esta loja ainda não tem tracking configurado — o link foi mantido como está.",
  };
}

// ─── Busca automática de dados do Mercado Livre (para o formulário manual) ──

export type MeliPreview = {
  name: string;
  price: number | null;
  oldPrice: number | null;
  imageUrl: string;
  productUrl: string;
};

/** Puxa título e preço automaticamente de um link de afiliado do Mercado Livre. */
export async function fetchMeliPreview(data: FormData): Promise<{ ok: true; data: MeliPreview } | { ok: false; error: string }> {
  await guard();
  const link = pick(data, "link");
  if (!link) return { ok: false, error: "Cole o link do produto." };

  const meli = await fetchMeliProduct(link);
  if (!meli) return { ok: false, error: "Não foi possível extrair os dados deste link. Confira se é um link válido do Mercado Livre." };

  return {
    ok: true,
    data: {
      name: meli.name,
      price: meli.price,
      oldPrice: meli.oldPrice,
      imageUrl: meli.imageUrl ?? "",
      productUrl: meli.productUrl,
    },
  };
}

// ─── Alertas ─────────────────────────────────────────────────────────────────

export async function toggleAlert(id: string, active: boolean) {
  await guard();
  await prisma.priceAlert.update({ where: { id }, data: { active } });
  revalidatePath("/admin/alertas");
}

export async function deleteAlert(id: string) {
  await guard();
  await prisma.priceAlert.delete({ where: { id } });
  revalidatePath("/admin/alertas");
}
