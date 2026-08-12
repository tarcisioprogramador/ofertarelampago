// ─────────────────────────────────────────────────────────────────────────────
// SEED — Oferta Relâmpago
// Dados de demonstração realistas. Em produção, o CMS/admin alimenta o banco.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** PRNG determinístico (mulberry32) */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000);
const round2 = (v: number) => Math.round(v * 100) / 100;

async function main() {
  console.log("🌩️  Seed do Oferta Relâmpago iniciado...");

  // ─── Limpeza (seed idempotente) ───────────────────────────────────────
  await prisma.priceAlert.deleteMany();
  await prisma.productFAQ.deleteMany();
  await prisma.faq.deleteMany();
  await prisma.comparisonItem.deleteMany();
  await prisma.comparison.deleteMany();
  await prisma.articleProduct.deleteMany();
  await prisma.article.deleteMany();
  await prisma.author.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.review.deleteMany();
  await prisma.prosCons.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.attributeDefinition.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // ─── Categorias + definições de atributos ──────────────────────────────
  const catDefs: {
    name: string;
    slug: string;
    desc: string;
    intro: string;
    seoTitle: string;
    seoDesc: string;
    order: number;
    attrs: { name: string; key: string; unit?: string; filterable?: boolean; type?: string; order: number }[];
  }[] = [
    {
      name: "Celulares",
      slug: "celulares",
      desc: "Celulares e smartphones com ficha técnica, comparação e os melhores preços.",
      intro:
        "Aqui você encontra a ficha técnica completa, comparações lado a lado e o histórico de preços dos principais smartphones do mercado. Comparamos ofertas em várias lojas para você comprar no menor preço.",
      seoTitle: "Celulares: ofertas, fichas técnicas e comparações",
      seoDesc:
        "Compare celulares e smartphones por preço, ficha técnica e avaliações. Veja ofertas atualizadas e o histórico de preços das principais lojas.",
      order: 1,
      attrs: [
        { name: "Tela", key: "screen", order: 1, filterable: true },
        { name: "Processador", key: "processor", order: 2 },
        { name: "RAM", key: "ram", order: 3, filterable: true },
        { name: "Armazenamento", key: "storage", order: 4, filterable: true },
        { name: "Câmera Traseira", key: "camera", order: 5 },
        { name: "Câmera Frontal", key: "frontCamera", order: 6 },
        { name: "Bateria", key: "battery", order: 7, filterable: true },
        { name: "Sistema Operacional", key: "os", order: 8, filterable: true },
        { name: "5G", key: "is5g", order: 9, filterable: true, type: "boolean" },
        { name: "Peso", key: "weight", order: 10, filterable: false },
        { name: "Dimensões", key: "dimensions", order: 11, filterable: false },
      ],
    },
    {
      name: "Notebooks",
      slug: "notebooks",
      desc: "Notebooks para estudo, trabalho e games com preços comparados.",
      intro:
        "Encontre o notebook ideal para o seu uso: estudo, trabalho ou games. Ficha técnica completa, comparação de modelos e histórico de preço nas principais lojas.",
      seoTitle: "Notebooks: comparações, ofertas e fichas técnicas",
      seoDesc:
        "Compare notebooks por processador, RAM e SSD. Veja ofertas atualizadas e o histórico de preços para comprar no melhor momento.",
      order: 2,
      attrs: [
        { name: "Processador", key: "processor", order: 1, filterable: true },
        { name: "RAM", key: "ram", order: 2, filterable: true },
        { name: "SSD", key: "ssd", order: 3, filterable: true },
        { name: "Tela", key: "screen", order: 4, filterable: true },
        { name: "GPU", key: "gpu", order: 5, filterable: false },
        { name: "Sistema Operacional", key: "os", order: 6, filterable: true },
        { name: "Bateria", key: "battery", order: 7 },
        { name: "Peso", key: "weight", order: 8 },
        { name: "Portas", key: "ports", order: 9 },
        { name: "Conectividade", key: "connectivity", order: 10 },
      ],
    },
    {
      name: "Televisores",
      slug: "televisores",
      desc: "Smart TVs LED, QLED e OLED com ofertas e comparativos.",
      intro:
        "Descubra qual TV vale a pena: LED, QLED ou OLED. Compare resolução, HDR, taxa de atualização e o histórico de preços das melhores lojas.",
      seoTitle: "Televisores: comparar TVs por preço e tecnologia",
      seoDesc:
        "Compare Smart TVs por tamanho, resolução e tecnologia. Veja ofertas de LED, QLED e OLED com histórico de preços atualizado.",
      order: 3,
      attrs: [
        { name: "Tamanho", key: "size", order: 1, filterable: true },
        { name: "Tecnologia", key: "tech", order: 2, filterable: true },
        { name: "Resolução", key: "resolution", order: 3, filterable: true },
        { name: "HDR", key: "hdr", order: 4 },
        { name: "Taxa de Atualização", key: "refreshRate", order: 5, filterable: true },
        { name: "Sistema", key: "os", order: 6, filterable: true },
        { name: "HDMI", key: "hdmi", order: 7 },
        { name: "Áudio", key: "audio", order: 8 },
        { name: "Conectividade", key: "connectivity", order: 9 },
      ],
    },
    {
      name: "Tablets",
      slug: "tablets",
      desc: "Tablets para estudo, entretenimento e trabalho.",
      intro:
        "Compare tablets por tela, RAM e armazenamento. Veja ofertas e o histórico de preços dos principais modelos do mercado.",
      seoTitle: "Tablets: ofertas e comparação de modelos",
      seoDesc:
        "Compare tablets por tela, processador e preço. Acompanhe o histórico de preços e encontre as melhores ofertas.",
      order: 4,
      attrs: [
        { name: "Tela", key: "screen", order: 1, filterable: true },
        { name: "Processador", key: "processor", order: 2 },
        { name: "RAM", key: "ram", order: 3, filterable: true },
        { name: "Armazenamento", key: "storage", order: 4, filterable: true },
        { name: "Bateria", key: "battery", order: 5 },
        { name: "Sistema", key: "os", order: 6, filterable: true },
        { name: "Peso", key: "weight", order: 7 },
        { name: "Caneta", key: "stylus", order: 8, filterable: true, type: "boolean" },
      ],
    },
    {
      name: "Smartwatches",
      slug: "smartwatches",
      desc: "Smartwatches e smartbands com preço comparado.",
      intro:
        "Compare smartwatches por tela, sistema e bateria. Acompanhe o histórico de preços e escolha o melhor relógio inteligente para você.",
      seoTitle: "Smartwatches: comparar preços e recursos",
      seoDesc:
        "Compare smartwatches e smartbands por recursos e preço. Veja ofertas atualizadas e histórico de preços.",
      order: 5,
      attrs: [
        { name: "Tela", key: "screen", order: 1 },
        { name: "Sistema", key: "os", order: 2, filterable: true },
        { name: "Bateria", key: "battery", order: 3 },
        { name: "Resistência à Água", key: "waterResistance", order: 4 },
        { name: "Sensores", key: "sensors", order: 5 },
        { name: "Armazenamento", key: "storage", order: 6 },
      ],
    },
    {
      name: "Fones de Ouvido",
      slug: "fones-de-ouvido",
      desc: "Fones bluetooth, com fio e com cancelamento de ruído.",
      intro:
        "Compare fones de ouvido por tipo, bateria e cancelamento de ruído. Acompanhe os preços e encontre a melhor oferta.",
      seoTitle: "Fones de Ouvido: ofertas e comparação",
      seoDesc:
        "Compare fones bluetooth e com fio por bateria, cancelamento de ruído e preço. Veja ofertas e histórico de preços.",
      order: 6,
      attrs: [
        { name: "Tipo", key: "type", order: 1, filterable: true },
        { name: "Bluetooth", key: "bluetooth", order: 2 },
        { name: "Cancelamento de Ruído", key: "anc", order: 3, filterable: true, type: "boolean" },
        { name: "Bateria", key: "battery", order: 4, filterable: true },
        { name: "Áudio", key: "audio", order: 5 },
        { name: "Peso", key: "weight", order: 6 },
      ],
    },
    {
      name: "Eletrodomésticos",
      slug: "eletrodomesticos",
      desc: "Geladeiras, fogões e eletrodomésticos com preço comparado.",
      intro:
        "Encontre eletrodomésticos com ficha técnica completa e os melhores preços do mercado. Comparamos ofertas para você economizar.",
      seoTitle: "Eletrodomésticos: ofertas e comparativos",
      seoDesc:
        "Compare geladeiras e eletrodomésticos por capacidade, eficiência e preço. Veja ofertas atualizadas nas principais lojas.",
      order: 7,
      attrs: [
        { name: "Tipo", key: "type", order: 1, filterable: true },
        { name: "Capacidade", key: "capacity", order: 2, filterable: true },
        { name: "Potência", key: "power", order: 3 },
        { name: "Eficiência", key: "efficiency", order: 4, filterable: true },
        { name: "Dimensões", key: "dimensions", order: 5 },
        { name: "Garantia", key: "warranty", order: 6 },
      ],
    },
    {
      name: "Informática",
      slug: "informatica",
      desc: "Monitores e periféricos com preço comparado.",
      intro:
        "Compare monitores e periféricos por tamanho, resolução e taxa de atualização. Acompanhe o histórico de preços das melhores lojas.",
      seoTitle: "Informática: monitores e periféricos com ofertas",
      seoDesc:
        "Compare monitores por resolução, taxa de atualização e painel. Veja ofertas atualizadas e histórico de preços.",
      order: 8,
      attrs: [
        { name: "Tamanho", key: "size", order: 1, filterable: true },
        { name: "Resolução", key: "resolution", order: 2, filterable: true },
        { name: "Taxa de Atualização", key: "refreshRate", order: 3, filterable: true },
        { name: "Painel", key: "panel", order: 4, filterable: true },
        { name: "Conexões", key: "ports", order: 5 },
        { name: "Peso", key: "weight", order: 6 },
      ],
    },
    {
      name: "Games",
      slug: "games",
      desc: "Consoles e games com os melhores preços.",
      intro:
        "Encontre consoles e jogos com preço comparado entre as principais lojas. Acompanhe o histórico e não pague mais caro.",
      seoTitle: "Games e Consoles: ofertas e comparativos",
      seoDesc:
        "Compare consoles por resolução, armazenamento e preço. Veja ofertas atualizadas e histórico de preços.",
      order: 9,
      attrs: [
        { name: "Tipo", key: "type", order: 1, filterable: true },
        { name: "Resolução", key: "resolution", order: 2, filterable: true },
        { name: "Armazenamento", key: "storage", order: 3, filterable: true },
        { name: "Processador", key: "processor", order: 4 },
        { name: "GPU", key: "gpu", order: 5 },
        { name: "Conectividade", key: "connectivity", order: 6 },
      ],
    },
  ];

  const categories: Record<string, string> = {};
  const attrDefs: Record<string, Record<string, string>> = {};
  for (const c of catDefs) {
    const cat = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        description: c.desc,
        intro: c.intro,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDesc,
        order: c.order,
      },
    });
    categories[c.slug] = cat.id;
    attrDefs[c.slug] = {};
    for (const a of c.attrs) {
      const ad = await prisma.attributeDefinition.create({
        data: {
          categoryId: cat.id,
          name: a.name,
          key: a.key,
          unit: a.unit,
          filterable: a.filterable ?? true,
          type: a.type ?? "text",
          order: a.order,
        },
      });
      attrDefs[c.slug][a.key] = ad.id;
    }
  }

  // ─── Marcas ─────────────────────────────────────────────────────────────
  const brandsData = [
    { name: "Samsung", slug: "samsung", desc: "Gigante sul-coreana de eletrônicos, líder em smartphones e TVs." },
    { name: "Motorola", slug: "motorola", desc: "Marca de celulares conhecida pelo bom custo-benefício." },
    { name: "Xiaomi", slug: "xiaomi", desc: "Fabricante chinesa de smartphones e eletrônicos com ótimo custo-benefício." },
    { name: "Apple", slug: "apple", desc: "Fabricante do iPhone, iPad e MacBook, referência em integração de ecossistema." },
    { name: "LG", slug: "lg", desc: "Marca de TVs OLED e eletrodomésticos premium." },
    { name: "Acer", slug: "acer", desc: "Fabricante de notebooks e monitores com bom equilíbrio entre preço e desempenho." },
    { name: "Dell", slug: "dell", desc: "Marca de notebooks e monitores voltada a trabalho e games." },
    { name: "Lenovo", slug: "lenovo", desc: "Uma das maiores fabricantes de notebooks e PCs do mundo." },
    { name: "JBL", slug: "jbl", desc: "Marca de áudio da Harman, referência em fones e caixas de som." },
    { name: "Brastemp", slug: "brastemp", desc: "Marca brasileira de eletrodomésticos premium, líder em geladeiras." },
    { name: "Sony", slug: "sony", desc: "Fabricante do PlayStation e de eletrônicos de imagem e áudio." },
    { name: "Nintendo", slug: "nintendo", desc: "Empresa japonesa de games, criadora do Switch." },
  ];
  const brands: Record<string, string> = {};
  for (const b of brandsData) {
    const br = await prisma.brand.create({ data: { name: b.name, slug: b.slug, description: b.desc } });
    brands[b.slug] = br.id;
  }

  // ─── Lojas ──────────────────────────────────────────────────────────────
  const storesData = [
    { name: "Amazon", slug: "amazon", url: "https://www.amazon.com.br", affiliateEnabled: true, shippingNote: "Frete grátis Prime" },
    { name: "Magazine Luiza", slug: "magazine-luiza", url: "https://www.magazineluiza.com.br", affiliateEnabled: true, shippingNote: "Frete grátis acima de R$ 99" },
    { name: "Mercado Livre", slug: "mercado-livre", url: "https://www.mercadolivre.com.br", affiliateEnabled: true, shippingNote: "Frete grátis em compras acima de R$ 79" },
    { name: "Americanas", slug: "americanas", url: "https://www.americanas.com.br", affiliateEnabled: true, shippingNote: "Frete grátis acima de R$ 99" },
    { name: "Casas Bahia", slug: "casas-bahia", url: "https://www.casasbahia.com.br", affiliateEnabled: true, shippingNote: "Frete grátis acima de R$ 99" },
    { name: "Kabum!", slug: "kabum", url: "https://www.kabum.com.br", affiliateEnabled: true, shippingNote: "Frete grátis acima de R$ 99" },
    { name: "Fast Shop", slug: "fast-shop", url: "https://www.fastshop.com.br", affiliateEnabled: false, shippingNote: "Frete grátis acima de R$ 149" },
    { name: "Ponto", slug: "ponto", url: "https://www.ponto.com.br", affiliateEnabled: false, shippingNote: "Frete grátis acima de R$ 99" },
  ];
  const stores: Record<string, string> = {};
  for (const s of storesData) {
    const st = await prisma.store.create({ data: s });
    stores[s.slug] = st.id;
  }

  // ─── Produtos ───────────────────────────────────────────────────────────
  type Prod = {
    name: string;
    brand: string;
    category: string;
    summary: string;
    description: string;
    release: string;
    featured?: boolean;
    isNew?: boolean;
    rating: number;
    reviewCount: number;
    attrs: Record<string, string>;
    pros: string[];
    cons: string[];
    offers: { store: string; price: number; oldPrice?: number; coupon?: string; shipping?: string; best?: boolean }[];
    editorial?: { rating: number; pros: string; cons: string; content: string };
    userReviews?: { name: string; rating: number; title: string; content: string; pros?: string; cons?: string }[];
  };

  const products: Prod[] = [
    {
      name: "Samsung Galaxy A17 5G",
      brand: "samsung",
      category: "celulares",
      summary: "Smartphone intermediário premium com tela Super AMOLED de 6,6\", 5G, bateria de 5.000 mAh e câmera de 50 MP.",
      description:
        "O Samsung Galaxy A17 5G é o intermediário da Samsung para 2026. Ele combina tela Super AMOLED de 6,6 polegadas com 120 Hz, processador Exynos 1480 e bateria de longa duração. É uma das melhores opções na faixa até R$ 1.200 quando entra em oferta, com câmeras versáteis e atualizações de sistema garantidas pela Samsung.",
      release: "2026-02-10",
      featured: true,
      rating: 4.6,
      reviewCount: 1284,
      attrs: {
        screen: "6,6\" Super AMOLED, 120 Hz, Full HD+",
        processor: "Exynos 1480",
        ram: "6 GB",
        storage: "128 GB",
        camera: "50 MP + 8 MP (ultrawide) + 2 MP (macro)",
        frontCamera: "13 MP",
        battery: "5.000 mAh",
        os: "Android 15 (One UI 7)",
        is5g: "Sim",
        weight: "188 g",
        dimensions: "164,1 x 75,3 x 8,4 mm",
      },
      pros: ["Tela Super AMOLED com 120 Hz", "Bateria que dura o dia todo", "5G e Wi-Fi 6", "Câmera principal de 50 MP com boa luz"],
      cons: ["Carregador não acompanha a caixa", "Sem carregamento sem fio", "Acabamento em plástico"],
      offers: [
        { store: "amazon", price: 1099, oldPrice: 1599, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 1199, oldPrice: 1499, shipping: "Frete grátis" },
        { store: "mercado-livre", price: 1249, oldPrice: 1499, shipping: "Frete grátis" },
        { store: "americanas", price: 1299, oldPrice: 1599, shipping: "Frete grátis acima de R$ 99" },
      ],
      editorial: {
        rating: 5,
        pros: "Tela excelente para a faixa, desempenho equilibrado e bateria de sobra",
        cons: "Sem carregador na caixa e carregamento lento (25 W)",
        content:
          "O Galaxy A17 5G é a recomendação mais equilibrada da Samsung na faixa intermediária em 2026. A tela Super AMOLED de 120 Hz impressiona pelo preço, o Exynos 1480 roda o dia a dia com fluidez e a bateria de 5.000 mAh facilmente passa de um dia de uso. Na câmera, o sensor de 50 MP entrega fotos boas com boa luz e versatilidade com a ultrawide. Para quem busca custo-benefício com garantia de atualizações, é difícil bater essa escolha.",
      },
      userReviews: [
        { name: "Rafael M.", rating: 5, title: "Bateria excelente", content: "Uso desde o lançamento, a bateria aguenta fácil um dia e meio. Tela muito bonita para o preço.", pros: "Tela, bateria", cons: "Só 25W de carregamento" },
        { name: "Juliana P.", rating: 4, title: "Ótimo custo-benefício", content: "Veio com carregador no meu pedido, mas a velocidade é básica. No geral, recomendo pela tela e desempenho.", pros: "Desempenho fluido", cons: "Carregamento lento" },
      ],
    },
    {
      name: "Motorola Moto G85 5G",
      brand: "motorola",
      category: "celulares",
      summary: "Celular com tela pOLED de 120 Hz, câmera com OIS e bateria de 5.000 mAh.",
      description:
        "O Moto G85 5G traz tela pOLED curvada de 6,7 polegadas com 120 Hz, processador Snapdragon 6s Gen 3 e câmera principal de 50 MP com estabilização óptica (OIS) — rara nesta faixa. É uma das apostas da Motorola para disputar o título de melhor custo-benefício em 2026.",
      release: "2025-11-05",
      rating: 4.5,
      reviewCount: 987,
      attrs: {
        screen: "6,7\" pOLED, 120 Hz, Full HD+",
        processor: "Snapdragon 6s Gen 3",
        ram: "8 GB",
        storage: "256 GB",
        camera: "50 MP (OIS) + 8 MP (ultrawide)",
        frontCamera: "32 MP",
        battery: "5.000 mAh",
        os: "Android 14 (promessa de atualização para Android 16)",
        is5g: "Sim",
        weight: "171 g",
        dimensions: "161,9 x 73,1 x 7,6 mm",
      },
      pros: ["Câmera com estabilização óptica", "Tela pOLED premium", "8 GB de RAM e 256 GB de armazenamento", "Design fino e leve"],
      cons: ["Atualizações de sistema limitadas", "Sem carregador na caixa", "Falante mono"],
      offers: [
        { store: "magazine-luiza", price: 1199, oldPrice: 1499, coupon: "MAGALU5", shipping: "Frete grátis", best: true },
        { store: "mercado-livre", price: 1229, oldPrice: 1499, shipping: "Frete grátis" },
        { store: "amazon", price: 1249, oldPrice: 1399, shipping: "Frete grátis Prime" },
      ],
      editorial: {
        rating: 4,
        pros: "Câmera com OIS, tela ótima e design premium",
        cons: "Política de atualizações curta",
        content:
          "O Moto G85 5G é forte concorrente na faixa dos R$ 1.200. O grande diferencial é a câmera com estabilização óptica, que entrega fotos e vídeos mais estáveis que a maioria dos rivais. A tela pOLED é excelente e o conjunto RAM/armazenamento é generoso. O ponto fraco é o compromisso curto de atualizações de sistema, o que pesa para quem pretende usar o aparelho por muitos anos.",
      },
    },
    {
      name: "Xiaomi Redmi Note 14 Pro",
      brand: "xiaomi",
      category: "celulares",
      summary: "Celular com câmera de 200 MP, tela AMOLED de 120 Hz e bateria de 5.100 mAh.",
      description:
        "O Redmi Note 14 Pro 5G é o intermediário premium da Xiaomi com câmera principal de 200 MP, tela AMOLED de 6,67 polegadas com 120 Hz e bateria de 5.100 mAh com carregamento rápido de 67 W. Traz ainda proteção IP68 contra água e poeira, rara na categoria.",
      release: "2026-01-20",
      rating: 4.4,
      reviewCount: 1432,
      attrs: {
        screen: "6,67\" AMOLED, 120 Hz, 1,5K",
        processor: "MediaTek Dimensity 7300 Ultra",
        ram: "8 GB",
        storage: "256 GB",
        camera: "200 MP (OIS) + 8 MP (ultrawide) + 2 MP (macro)",
        frontCamera: "20 MP",
        battery: "5.100 mAh",
        os: "Android 15 (HyperOS 2)",
        is5g: "Sim",
        weight: "190 g",
        dimensions: "162,3 x 74,4 x 8,3 mm",
      },
      pros: ["Câmera de 200 MP muito detalhada", "Carregamento rápido de 67 W", "Proteção IP68", "Tela brilhante e colorida"],
      cons: ["HyperOS vem com muitos apps", "Vídeo 4K limitado a 30 fps", "Disponibilidade oscila"],
      offers: [
        { store: "amazon", price: 1299, oldPrice: 1699, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "kabum", price: 1349, oldPrice: 1699, coupon: "KABUM15", shipping: "Frete grátis" },
        { store: "mercado-livre", price: 1399, oldPrice: 1599, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Câmera de 200 MP, carregamento rápido e IP68",
        cons: "Software com bloatware e gravação 4K limitada",
        content:
          "O Redmi Note 14 Pro 5G impressiona no papel e na prática: a câmera de 200 MP captura detalhes impressionantes com boa luz, o carregamento de 67 W leva a bateria de 5.100 mAh a 100% em cerca de 45 minutos e a proteção IP68 é um luxo inédito na faixa. A interface HyperOS, porém, vem com apps pré-instalados e a gravação em 4K fica limitada a 30 fps. Pelo preço em oferta, é um dos aparelhos mais completos da categoria.",
      },
    },
    {
      name: "Apple iPhone 15",
      brand: "apple",
      category: "celulares",
      summary: "iPhone com Dynamic Island, câmera de 48 MP e chip A16 Bionic.",
      description:
        "O iPhone 15 trouxe a Dynamic Island para a linha padrão, câmera principal de 48 MP e o chip A16 Bionic com desempenho de sobra. É a porta de entrada do ecossistema Apple com ótima qualidade de câmera e longevidade de atualizações.",
      release: "2023-09-22",
      rating: 4.7,
      reviewCount: 2210,
      attrs: {
        screen: "6,1\" OLED Super Retina XDR, 60 Hz",
        processor: "Apple A16 Bionic",
        ram: "6 GB",
        storage: "128 GB",
        camera: "48 MP (principal) + 12 MP (ultrawide)",
        frontCamera: "12 MP",
        battery: "3.349 mAh",
        os: "iOS 17 (atualizável para iOS 18)",
        is5g: "Sim",
        weight: "171 g",
        dimensions: "147,6 x 71,6 x 7,8 mm",
      },
      pros: ["Câmeras excelentes e versáteis", "Longevidade de atualizações (6+ anos)", "Desempenho consistente", "Construção premium"],
      cons: ["Tela de 60 Hz na faixa de preço", "Carregamento lento (20 W máx.)", "Bateria média"],
      offers: [
        { store: "fast-shop", price: 3999, oldPrice: 4499, shipping: "Frete grátis", best: true },
        { store: "amazon", price: 4129, oldPrice: 4499, shipping: "Frete grátis Prime" },
        { store: "casas-bahia", price: 4199, oldPrice: 4499, coupon: "CB10FRE", shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Câmeras ótimas e ecossistema maduro",
        cons: "Tela de 60 Hz e carregamento lento",
        content:
          "O iPhone 15 segue sendo a melhor porta de entrada para o ecossistema Apple. A câmera de 48 MP eleva a qualidade das fotos, o A16 Bionic garante fluidez por anos e a promessa de atualizações é a mais longa do mercado. Em 2026 ele aparece com frequência abaixo dos R$ 4.000, o que o torna competitivo frente aos tops Android — principalmente para quem valoriza câmera e longevidade acima de taxa de atualização de tela.",
      },
    },
    {
      name: "Samsung Galaxy S24 FE",
      brand: "samsung",
      category: "celulares",
      summary: "Flagship acessível com Galaxy AI, tela de 120 Hz e câmera com zoom óptico de 3x.",
      description:
        "O Galaxy S24 FE traz o pacote Galaxy AI, tela Dynamic AMOLED de 6,7 polegadas com 120 Hz, processador Exynos 2400e e câmera com zoom óptico de 3x. É a opção mais acessível para quem quer recursos de flagship da Samsung.",
      release: "2025-10-01",
      isNew: true,
      rating: 4.5,
      reviewCount: 654,
      attrs: {
        screen: "6,7\" Dynamic AMOLED 2X, 120 Hz, FHD+",
        processor: "Exynos 2400e",
        ram: "8 GB",
        storage: "256 GB",
        camera: "50 MP + 12 MP (ultrawide) + 8 MP (telefoto 3x)",
        frontCamera: "10 MP",
        battery: "4.700 mAh",
        os: "Android 14 (One UI 6.1, Galaxy AI)",
        is5g: "Sim",
        weight: "213 g",
        dimensions: "162 x 77,3 x 8 mm",
      },
      pros: ["Galaxy AI incluído", "Zoom óptico de 3x", "7 anos de atualizações", "Bom desempenho em games"],
      cons: ["Bateria poderia ser maior", "Carregamento de 25 W", "Preço acima dos intermediários"],
      offers: [
        { store: "amazon", price: 2899, oldPrice: 3599, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 2999, oldPrice: 3599, shipping: "Frete grátis" },
        { store: "fast-shop", price: 3099, oldPrice: 3599, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Recursos de flagship por menos, zoom 3x e 7 anos de updates",
        cons: "Bateria de 4.700 mAh abaixo dos rivais",
        content:
          "O S24 FE é a porta de entrada mais inteligente para os recursos premium da Samsung: Galaxy AI, zoom óptico e sete anos de atualizações. Em ofertas frequentes na casa dos R$ 2.900, entrega experiência muito próxima da linha S. A bateria de 4.700 mAh é o ponto mais fraco em comparação com os concorrentes da mesma faixa, mas a recarga rápida compensa no dia a dia.",
      },
    },
    {
      name: "Acer Aspire 5",
      brand: "acer",
      category: "notebooks",
      summary: "Notebook com Core i5 de 13ª geração, 8 GB de RAM e SSD de 512 GB.",
      description:
        "O Acer Aspire 5 é o notebook mais vendido da Acer no Brasil. A versão com Intel Core i5-1335U, 8 GB de RAM e SSD de 512 GB atende bem estudo, trabalho e tarefas do dia a dia, com tela Full HD IPS de 15,6 polegadas e carcaça resistente.",
      release: "2024-03-15",
      featured: true,
      rating: 4.3,
      reviewCount: 1765,
      attrs: {
        processor: "Intel Core i5-1335U (10 núcleos, até 4,6 GHz)",
        ram: "8 GB (DDR4)",
        ssd: "512 GB NVMe",
        screen: "15,6\" Full HD IPS",
        gpu: "Intel Iris Xe",
        os: "Windows 11 Home",
        battery: "50 Wh (até 8h)",
        weight: "1,78 kg",
        ports: "2x USB 3.2, 1x USB-C, HDMI, RJ45, P2",
        connectivity: "Wi-Fi 6, Bluetooth 5.1",
      },
      pros: ["Bom desempenho para o dia a dia", "SSD NVMe rápido", "Teclado confortável com teclado numérico", "Preço competitivo"],
      cons: ["Construção em plástico", "Tela com brilho limitado", "8 GB de RAM soldados (sem upgrade)?"],
      offers: [
        { store: "kabum", price: 2999, oldPrice: 3799, coupon: "KABUM15", shipping: "Frete grátis", best: true },
        { store: "amazon", price: 3129, oldPrice: 3799, shipping: "Frete grátis Prime" },
        { store: "magazine-luiza", price: 3199, oldPrice: 3799, shipping: "Frete grátis" },
        { store: "americanas", price: 3249, oldPrice: 3799, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Ótimo custo-benefício para estudo e trabalho",
        cons: "Acabamento simples e tela com brilho médio",
        content:
          "O Aspire 5 é a escolha padrão de quem precisa de um notebook confiável para estudar e trabalhar sem gastar muito. O Core i5 de 13ª geração dá conta de multitarefa, planilhas, navegação com muitas abas e até edição leve. Em oferta na casa dos R$ 3.000, é difícil encontrar concorrente com o mesmo conjunto. Para quem precisa de mais RAM ou GPU dedicada, vale olhar as versões superiores ou os rivais gamer de entrada.",
      },
    },
    {
      name: "Lenovo IdeaPad Slim 3",
      brand: "lenovo",
      category: "notebooks",
      summary: "Notebook fino e leve com Ryzen 5, 16 GB de RAM e SSD de 512 GB.",
      description:
        "O IdeaPad Slim 3 é a aposta da Lenovo para mobilidade com desempenho: Ryzen 5 7530U, 16 GB de RAM e SSD de 512 GB em um corpo de apenas 1,62 kg. Ideal para estudantes que levam o notebook para todo lugar.",
      release: "2024-06-10",
      rating: 4.4,
      reviewCount: 892,
      attrs: {
        processor: "AMD Ryzen 5 7530U",
        ram: "16 GB (DDR4)",
        ssd: "512 GB NVMe",
        screen: "15,6\" Full HD TN",
        gpu: "Radeon Graphics integrada",
        os: "Windows 11 Home",
        battery: "47 Wh (até 7h)",
        weight: "1,62 kg",
        ports: "2x USB-A, 1x USB-C, HDMI, P2",
        connectivity: "Wi-Fi 6, Bluetooth 5.1",
      },
      pros: ["16 GB de RAM", "Leve e fino", "Bom desempenho em multitarefa", "Teclado espaçoso"],
      cons: ["Tela TN com ângulos de visão limitados", "Bateria mediana", "Sem teclado numérico"],
      offers: [
        { store: "amazon", price: 2899, oldPrice: 3399, shipping: "Frete grátis Prime", best: true },
        { store: "mercado-livre", price: 2949, oldPrice: 3399, shipping: "Frete grátis" },
        { store: "fast-shop", price: 2999, oldPrice: 3399, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "16 GB de RAM e portabilidade",
        cons: "Tela TN decepciona pelo preço",
        content:
          "O IdeaPad Slim 3 entrega o que promete: leveza para o dia a dia e 16 GB de RAM que evitam travamentos em multitarefa. O Ryzen 5 é ágil e econômico. O calcanhar de aquiles é a tela TN, que perde em cores e ângulos de visão para os rivais com painel IPS — se você passa horas assistindo conteúdo, priorize outra opção. Para estudo e trabalho, é uma compra muito racional.",
      },
    },
    {
      name: "Dell Inspiron 15",
      brand: "dell",
      category: "notebooks",
      summary: "Notebook com Core i7, 16 GB de RAM e SSD de 1 TB.",
      description:
        "O Inspiron 15 é o notebook de trabalho da Dell com Intel Core i7-1355U, 16 GB de RAM, SSD de 1 TB e tela Full HD de 15,6 polegadas. Construção sólida, teclado confortável e suporte oficial no Brasil.",
      release: "2023-08-20",
      rating: 4.2,
      reviewCount: 643,
      attrs: {
        processor: "Intel Core i7-1355U",
        ram: "16 GB (DDR4)",
        ssd: "1 TB NVMe",
        screen: "15,6\" Full HD",
        gpu: "Intel Iris Xe",
        os: "Windows 11 Pro",
        battery: "54 Wh",
        weight: "1,82 kg",
        ports: "2x USB-A, 1x USB-C, HDMI, SD, RJ45",
        connectivity: "Wi-Fi 6, Bluetooth 5.2",
      },
      pros: ["Core i7 e 16 GB de RAM", "SSD de 1 TB", "Windows 11 Pro", "Garantia e suporte nacionais"],
      cons: ["Design conservador", "Tela sem taxa alta", "Preço acima de rivais com specs similares"],
      offers: [
        { store: "fast-shop", price: 3799, oldPrice: 4399, shipping: "Frete grátis", best: true },
        { store: "amazon", price: 3899, oldPrice: 4399, shipping: "Frete grátis Prime" },
        { store: "casas-bahia", price: 3999, oldPrice: 4399, coupon: "CB10FRE", shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Desempenho alto e suporte sólido",
        cons: "Custa mais que rivais equivalentes",
        content:
          "O Inspiron 15 é a escolha segura de quem trabalha com o notebook aberto o dia inteiro e valoriza suporte local. O Core i7 com 16 GB de RAM e SSD de 1 TB não deixa a desejar em nenhuma tarefa. O preço é o ponto de atenção: rivais com especificações parecidas costumam custar menos, então vale esperar ofertas próximas dos R$ 3.700.",
      },
    },
    {
      name: "Apple MacBook Air M3",
      brand: "apple",
      category: "notebooks",
      summary: "Notebook ultrafino com chip M3, tela Liquid Retina e bateria de até 18 horas.",
      description:
        "O MacBook Air M3 é o notebook mais popular da Apple: chip M3 com 8 núcleos, tela Liquid Retina de 13,6 polegadas, corpo de 1,24 kg e bateria para até 18 horas. Silencioso, rápido e com ecossistema macOS.",
      release: "2024-03-08",
      rating: 4.8,
      reviewCount: 2105,
      attrs: {
        processor: "Apple M3 (8 núcleos CPU, 8 GPU)",
        ram: "8 GB (unificado)",
        ssd: "256 GB",
        screen: "13,6\" Liquid Retina",
        gpu: "Apple GPU 8 núcleos",
        os: "macOS Sonoma",
        battery: "52,6 Wh (até 18h)",
        weight: "1,24 kg",
        ports: "2x Thunderbolt/USB-C, MagSafe 3, P2",
        connectivity: "Wi-Fi 6E, Bluetooth 5.3",
      },
      pros: ["Desempenho silencioso e eficiente", "Bateria extraordinária", "Tela e construção premium", "Ecosistema macOS"],
      cons: ["8 GB de RAM e 256 GB de SSD de série", "Preço elevado no Brasil", "Só duas portas USB-C"],
      offers: [
        { store: "fast-shop", price: 8499, oldPrice: 9499, shipping: "Frete grátis", best: true },
        { store: "amazon", price: 8699, oldPrice: 9499, shipping: "Frete grátis Prime" },
        { store: "mercado-livre", price: 8799, oldPrice: 9499, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 5,
        pros: "Bateria e desempenho imbatíveis na categoria",
        cons: "Configuração base com 8 GB/256 GB limita upgrade",
        content:
          "O MacBook Air M3 continua a ser a referência em notebooks ultrafinos. A combinação de desempenho silencioso, bateria de 18 horas e construção impecável justifica o investimento — desde que você se encaixe no uso proposto (navegação, produtividade, edição leve). Para quem roda tarefas pesadas, o modelo com 16 GB de RAM é o upgrade certo. É o notebook mais caro desta lista, mas também o mais durável.",
      },
    },
    {
      name: "LG OLED C4 65",
      brand: "lg",
      category: "televisores",
      summary: "Smart TV OLED 4K de 65\" com 120 Hz, Dolby Vision e webOS.",
      description:
        "A LG OLED C4 é uma das melhores TVs do mercado: painel OLED evo 4K de 65 polegadas com 120 Hz, suporte a Dolby Vision, G-Sync e FreeSync, além do webOS com todos os apps de streaming. Preto absoluto e cores de referência.",
      release: "2024-04-01",
      featured: true,
      rating: 4.8,
      reviewCount: 876,
      attrs: {
        size: "65 polegadas",
        tech: "OLED evo",
        resolution: "4K (3840 x 2160)",
        hdr: "Dolby Vision, HDR10, HLG",
        refreshRate: "120 Hz (até 144 Hz em PC)",
        os: "webOS 24",
        hdmi: "4x HDMI 2.1",
        audio: "40 W (som com suporte a Dolby Atmos)",
        connectivity: "Wi-Fi 5, Bluetooth 5.0, AirPlay 2",
      },
      pros: ["Qualidade de imagem de referência", "4 entradas HDMI 2.1", "120 Hz perfeito para games", "webOS rápido e completo"],
      cons: ["Risco de burn-in (uso intenso com logos fixos)", "Brilho menor que QLEDs de ponta", "Preço premium"],
      offers: [
        { store: "fast-shop", price: 6999, oldPrice: 9999, shipping: "Frete grátis", best: true },
        { store: "amazon", price: 7299, oldPrice: 9999, shipping: "Frete grátis Prime" },
        { store: "magazine-luiza", price: 7499, oldPrice: 9999, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 5,
        pros: "A melhor imagem da categoria por muito",
        cons: "Cuidado com conteúdo estático por horas seguidas",
        content:
          "A OLED C4 é a TV que redefiniu a categoria de 65 polegadas em 2024 e segue relevante em 2026. Preto absoluto, cores precisas, 120 Hz para games e quatro HDMI 2.1 para consoles e PC. Por R$ 7.000 em oferta, entrega uma experiência que TVs LCD de 80 polegadas não alcançam em qualidade de imagem. É a escolha definitiva para cinema e games.",
      },
    },
    {
      name: "Samsung Crystal UHD CU7700 55",
      brand: "samsung",
      category: "televisores",
      summary: "Smart TV 4K de 55\" com processador Crystal 4K e Tizen.",
      description:
        "A Samsung Crystal UHD CU7700 é a TV 4K mais vendida da Samsung: 55 polegadas, processador Crystal 4K com upscaling, suporte a HDR10+ e o sistema Tizen com todas as plataformas de streaming. Ótima relação custo-benefício para salas de estar.",
      release: "2023-05-15",
      rating: 4.4,
      reviewCount: 3120,
      attrs: {
        size: "55 polegadas",
        tech: "LED (Crystal)",
        resolution: "4K (3840 x 2160)",
        hdr: "HDR10+, HLG",
        refreshRate: "60 Hz",
        os: "Tizen",
        hdmi: "3x HDMI 2.0",
        audio: "20 W",
        connectivity: "Wi-Fi 5, Bluetooth 4.2",
      },
      pros: ["Excelente custo-benefício", "Upscaling bom para conteúdo Full HD", "Tizen fluido e completo", "Design slim com bordas finas"],
      cons: ["Sem HDMI 2.1 (60 Hz máximo)", "HDR limitado pela falta de local dimming", "Som fraco"],
      offers: [
        { store: "amazon", price: 2299, oldPrice: 2999, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 2399, oldPrice: 2999, shipping: "Frete grátis" },
        { store: "casas-bahia", price: 2449, oldPrice: 2999, coupon: "CB10FRE", shipping: "Frete grátis" },
        { store: "ponto", price: 2499, oldPrice: 2999, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "A melhor TV 4K custo-benefício de 55\"",
        cons: "Sem 120 Hz e HDR limitado",
        content:
          "A CU7700 é a resposta da Samsung para quem quer uma TV 4K de 55 polegadas sem gastar fortunas. O upscaling deixa canais e conteúdo Full HD nítidos, o Tizen é dos sistemas mais completos e o design agrada. Para games no PS5 é suficiente (4K 60 Hz), mas quem busca 120 Hz deve subir de categoria. Pelo preço em oferta, é uma compra sem arrependimento para o uso familiar.",
      },
    },
    {
      name: "Samsung Galaxy Tab S9 FE",
      brand: "samsung",
      category: "tablets",
      summary: "Tablet com S Pen inclusa, tela de 10,9\" e proteção IP68.",
      description:
        "O Galaxy Tab S9 FE é o tablet intermediário premium da Samsung: tela de 10,9 polegadas, 6 GB de RAM, 128 GB de armazenamento, S Pen inclusa e proteção IP68. Perfeito para estudos, anotações e streaming.",
      release: "2023-10-10",
      rating: 4.5,
      reviewCount: 1154,
      attrs: {
        screen: "10,9\" LCD, 90 Hz",
        processor: "Exynos 1380",
        ram: "6 GB",
        storage: "128 GB",
        battery: "8.000 mAh",
        os: "Android 14 (One UI)",
        weight: "524 g",
        stylus: "Sim (S Pen inclusa)",
      },
      pros: ["S Pen inclusa na caixa", "Proteção IP68", "Boa tela para o preço", "Atualizações garantidas"],
      cons: ["Tela LCD (não AMOLED)", "Carregamento de 45 W não vem na caixa", "Desempenho mediano em games"],
      offers: [
        { store: "amazon", price: 1999, oldPrice: 2599, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 2099, oldPrice: 2599, shipping: "Frete grátis" },
        { store: "mercado-livre", price: 2149, oldPrice: 2599, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "S Pen inclusa e IP68 em tablet intermediário",
        cons: "Tela LCD deixa a desejar em contraste",
        content:
          "O Tab S9 FE é a escolha mais racional para quem quer um tablet com caneta sem pagar o preço da linha S. A S Pen inclusa transforma o aparelho em uma ferramenta de anotações e estudos, e a proteção IP68 é única na categoria. A tela LCD é boa, mas sente falta do AMOLED. Para o preço em oferta, entrega muito.",
      },
    },
    {
      name: "Apple iPad 10",
      brand: "apple",
      category: "tablets",
      summary: "iPad de entrada com tela Liquid Retina 10,9\" e chip A14.",
      description:
        "O iPad de 10ª geração é a porta de entrada do ecossistema iPad: tela Liquid Retina de 10,9 polegadas, chip A14 Bionic, USB-C e suporte à Apple Pencil (1ª geração, via adaptador). Excelente para estudos, consumo de mídia e até trabalho leve.",
      release: "2022-10-26",
      rating: 4.6,
      reviewCount: 1987,
      attrs: {
        screen: "10,9\" Liquid Retina",
        processor: "Apple A14 Bionic",
        ram: "4 GB",
        storage: "64 GB",
        battery: "32,4 Wh (até 10h)",
        os: "iPadOS",
        weight: "477 g",
        stylus: "Sim (Apple Pencil 1 com adaptador)",
      },
      pros: ["Ecosistema iPad maduro", "Ótimo para estudos e streaming", "Boa duração de bateria", "USB-C"],
      cons: ["Apple Pencil 1 precisa de adaptador", "Armazenamento base de 64 GB", "Tela sem laminação"],
      offers: [
        { store: "fast-shop", price: 2799, oldPrice: 3299, shipping: "Frete grátis", best: true },
        { store: "amazon", price: 2899, oldPrice: 3299, shipping: "Frete grátis Prime" },
        { store: "mercado-livre", price: 2949, oldPrice: 3299, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Ecossistema, fluidez e durabilidade",
        cons: "Pencil 1 com adaptador e 64 GB de série",
        content:
          "O iPad 10 continua fazendo sentido em 2026: fluido, com dezenas de milhares de apps otimizados e bateria para o dia todo. O calcanhar de aquiles é o armazenamento base de 64 GB e a Apple Pencil de 1ª geração, que exige adaptador. Para estudo e mídia, é a melhor escolha na faixa; para desenho profissional, o iPad Air é o passo certo.",
      },
    },
    {
      name: "Samsung Galaxy Watch 7",
      brand: "samsung",
      category: "smartwatches",
      summary: "Smartwatch com Wear OS, monitoramento de saúde e GPS.",
      description:
        "O Galaxy Watch 7 traz o Wear OS com Galaxy AI, sensor BioActive de última geração, GPS, 2 GB de RAM e monitoramento avançado de saúde, incluindo análise de composição corporal. Versão de 40 mm.",
      release: "2025-07-24",
      isNew: true,
      rating: 4.5,
      reviewCount: 743,
      attrs: {
        screen: "1,3\" Super AMOLED, 432 x 432",
        os: "Wear OS 5 (One UI 6 Watch)",
        battery: "300 mAh (até 40h)",
        waterResistance: "IP68, 5 ATM",
        sensors: "BioActive (ECG, bioimpedância), acelerômetro, giroscópio, GPS",
        storage: "32 GB",
      },
      pros: ["Wear OS completo com Google Play", "Sensores de saúde avançados", "Resposta rápida", "GPS e NFC (Samsung Pay)"],
      cons: ["Bateria de ~1,5 dia", "Carregador incluso é lento", "Recursos de IA dependem de celular Samsung"],
      offers: [
        { store: "amazon", price: 1699, oldPrice: 2199, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 1799, oldPrice: 2199, shipping: "Frete grátis" },
        { store: "fast-shop", price: 1849, oldPrice: 2199, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "O melhor smartwatch Android completo",
        cons: "Bateria para pouco mais de um dia",
        content:
          "O Galaxy Watch 7 é a referência em smartwatches com Android: Wear OS maduro, sensores de saúde de nível clínico e resposta ágil. A bateria é o ponto fraco clássico — quem quer uma semana de duração deve olhar os smartbands ou os Garmin. Se o seu celular é Android, é a compra mais completa da categoria em oferta.",
      },
    },
    {
      name: "Xiaomi Smart Band 9",
      brand: "xiaomi",
      category: "smartwatches",
      summary: "Smartband com tela AMOLED de 1,62\", bateria de 21 dias e 150 modos de esporte.",
      description:
        "A Smart Band 9 é a pulseira inteligente mais vendida do mundo: tela AMOLED de 1,62 polegadas, bateria para até 21 dias, monitoramento de saúde 24h e 150 modos de esporte. Custo-benefício imbatível.",
      release: "2025-06-15",
      rating: 4.6,
      reviewCount: 4521,
      attrs: {
        screen: "1,62\" AMOLED, 490 x 192",
        os: "Mi Fitness (app)",
        battery: "233 mAh (até 21 dias)",
        waterResistance: "5 ATM",
        sensors: "FC, SpO2, sono, estresse",
        storage: "—",
      },
      pros: ["Bateria de até 21 dias", "Tela AMOLED bonita", "Custo-benefício imbatível", "Leve e confortável"],
      cons: ["Sem GPS próprio (usa o do celular)", "Sem NFC no Brasil", "Funções de saúde resumidas"],
      offers: [
        { store: "amazon", price: 249, oldPrice: 349, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "mercado-livre", price: 259, oldPrice: 349, shipping: "Frete grátis" },
        { store: "americanas", price: 269, oldPrice: 349, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 5,
        pros: "Tudo que importa em uma smartband por menos de R$ 300",
        cons: "Sem GPS próprio",
        content:
          "A Smart Band 9 é a compra mais óbvia desta lista: por menos de R$ 300 entrega tela AMOLED, bateria de três semanas e monitoramento de saúde confiável. Não tem GPS próprio, mas para o uso fitness casual isso dificilmente importa. Se você quer um relógio com apps e ligações, ela não é para você — mas como pulseira inteligente, é imbatível.",
      },
    },
    {
      name: "JBL Tune 770NC",
      brand: "jbl",
      category: "fones-de-ouvido",
      summary: "Fone over-ear com cancelamento de ruído ativo e 70 horas de bateria.",
      description:
        "O JBL Tune 770NC é o fone over-ear com cancelamento de ruído ativo (ANC) mais popular do Brasil: 70 horas de bateria, Bluetooth 5.3, conexão multiponto e o som assinatura JBL com bass potente.",
      release: "2024-09-01",
      featured: true,
      rating: 4.6,
      reviewCount: 2876,
      attrs: {
        type: "Over-ear",
        bluetooth: "Bluetooth 5.3 (SBC, AAC)",
        anc: "Sim",
        battery: "70 h (com ANC) / 44 h (ANC ativo)",
        audio: "Driver de 40 mm, som assinatura JBL",
        weight: "232 g",
      },
      pros: ["Bateria absurda de 70 horas", "ANC eficiente pelo preço", "Conexão multiponto", "Confortável por horas"],
      cons: ["Construção em plástico", "Sem app com EQ completo no iOS?", "Estojo rígido não incluso"],
      offers: [
        { store: "amazon", price: 429, oldPrice: 599, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 449, oldPrice: 599, shipping: "Frete grátis" },
        { store: "mercado-livre", price: 459, oldPrice: 599, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 5,
        pros: "O melhor fone ANC custo-benefício do Brasil",
        cons: "Plástico em todo o corpo",
        content:
          "O Tune 770NC dominou o mercado brasileiro por um motivo: ANC eficiente, som agradável com graves marcantes e bateria que dura uma semana de uso. Por R$ 429 em oferta, não existe concorrente no mesmo patamar. A construção é simples, mas o conjunto é tão bom que vira uma recomendação quase universal.",
      },
    },
    {
      name: "Samsung Galaxy Buds FE",
      brand: "samsung",
      category: "fones-de-ouvido",
      summary: "Fone TWS com ANC, graves potentes e conforto.",
      description:
        "Os Galaxy Buds FE são os fones true wireless da Samsung com cancelamento de ruído ativo, drivers de 12 mm com graves reforçados e carregamento rápido. Perfeitos para quem vive no ecossistema Android.",
      release: "2023-10-05",
      rating: 4.5,
      reviewCount: 1934,
      attrs: {
        type: "TWS (intra-auricular)",
        bluetooth: "Bluetooth 5.2 (SBC, AAC)",
        anc: "Sim",
        battery: "6 h (com ANC) / 21 h com estojo",
        audio: "Driver de 12 mm",
        weight: "5,6 g (cada fone)",
      },
      pros: ["ANC em fone barato", "Graves potentes", "Conforto e ajuste", "Carregamento rápido"],
      cons: ["Sem carregamento sem fio", "Sem codec avançado (LDAC/aptX)", "Estojo grande"],
      offers: [
        { store: "magazine-luiza", price: 449, oldPrice: 599, coupon: "MAGALU5", shipping: "Frete grátis", best: true },
        { store: "amazon", price: 469, oldPrice: 599, shipping: "Frete grátis Prime" },
        { store: "kabum", price: 479, oldPrice: 599, coupon: "KABUM15", shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "ANC de verdade por menos de R$ 500",
        cons: "Sem carregamento sem fio",
        content:
          "Os Buds FE mostram que a Samsung sabe fazer fone acessível sem cortar o essencial: o ANC funciona bem, os graves agradam e o ajuste é confortável para uso prolongado. Faltam codecs avançados e carregamento sem fio, mas no dia a dia isso raramente faz falta. Melhor TWS da faixa para quem usa Android.",
      },
    },
    {
      name: "Brastemp Inverse 443L",
      brand: "brastemp",
      category: "eletrodomesticos",
      summary: "Geladeira inverse frost free de 443 litros com porta de 88 cm.",
      description:
        "A Brastemp Inverse BRE63 é a geladeira inverse frost free de 443 litros mais vendida do Brasil: porta de 88 cm, compartimento exclusivo para bebidas, filtro de ar interno e eficiência energética A. Evaporação automática e design premium.",
      release: "2023-02-01",
      featured: true,
      rating: 4.7,
      reviewCount: 3156,
      attrs: {
        type: "Inverse (frigobar embaixo)",
        capacity: "443 litros",
        power: "—",
        efficiency: "Classe A",
        dimensions: "178,5 x 75,5 x 73 cm",
        warranty: "1 ano (12 meses)",
      },
      pros: ["Porta de 88 cm para latas", "Frost free com filtro de ar", "Eficiência energética A", "Compartimento de bebidas"],
      cons: ["Preço alto", "Barulho do compressor em ambientes silenciosos", "Ocupa bastante espaço"],
      offers: [
        { store: "casas-bahia", price: 4499, oldPrice: 5499, coupon: "CB10FRE", shipping: "Frete grátis", best: true },
        { store: "magazine-luiza", price: 4699, oldPrice: 5499, shipping: "Frete grátis" },
        { store: "amazon", price: 4799, oldPrice: 5499, shipping: "Frete grátis Prime" },
        { store: "ponto", price: 4899, oldPrice: 5499, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "A geladeira mais desejada do Brasil com ótimo espaço",
        cons: "Preço de entrada elevado",
        content:
          "A Brastemp Inverse 443L é sinônimo de cozinha dos sonhos: a porta de 88 cm organiza latas e bebidas, o espaço interno é generoso e o design transforma o ambiente. Pelo preço, espera-se qualidade, e ela entrega — com o selo de eficiência A aliviando a conta de luz. Em oferta abaixo de R$ 4.500, é uma das compras mais gratificantes da categoria de eletrodomésticos.",
      },
    },
    {
      name: "LG UltraGear 27GS60QC",
      brand: "lg",
      category: "informatica",
      summary: "Monitor gamer curvo de 27\" QHD com 180 Hz e 1 ms.",
      description:
        "O UltraGear 27GS60QC é o monitor gamer da LG com painel VA curvo de 27 polegadas, resolução QHD (2560x1440), 180 Hz, tempo de resposta de 1 ms, HDR10 e AMD FreeSync Premium. Imersão e fluidez para games e trabalho.",
      release: "2024-08-15",
      rating: 4.4,
      reviewCount: 1023,
      attrs: {
        size: "27 polegadas",
        resolution: "QHD (2560 x 1440)",
        refreshRate: "180 Hz",
        panel: "VA curvo (1500R)",
        ports: "2x HDMI, 1x DisplayPort, P2",
        weight: "5,6 kg (com base)",
      },
      pros: ["180 Hz com QHD pelo preço", "Curvatura imersiva", "FreeSync Premium", "Suporte com ajuste de altura"],
      cons: ["Painel VA (ghosting em transições escuras)", "HDR básico (sem local dimming)", "Controles OSD básicos"],
      offers: [
        { store: "kabum", price: 1299, oldPrice: 1899, coupon: "KABUM15", shipping: "Frete grátis", best: true },
        { store: "amazon", price: 1399, oldPrice: 1899, shipping: "Frete grátis Prime" },
        { store: "mercado-livre", price: 1449, oldPrice: 1899, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "QHD 180 Hz por menos de R$ 1.400",
        cons: "VA tem limitações em contraste dinâmico",
        content:
          "O UltraGear 27GS60QC entrega o que importa para games: QHD nítido, 180 Hz fluido e 1 ms de resposta, com FreeSync Premium eliminando tearing. A curva de 1500R imerge e o suporte com ajuste de altura é um bônus raro na faixa. O painel VA mostra leve ghosting em cenas escuras, mas pelo preço em oferta é o monitor gamer com melhor custo-benefício desta lista.",
      },
    },
    {
      name: "Sony PlayStation 5 Slim",
      brand: "sony",
      category: "games",
      summary: "Console de nova geração com SSD ultrarrápido e DualSense.",
      description:
        "O PlayStation 5 Slim com leitor de disco traz o SSD customizado de nova geração, ray tracing, suporte a 120 Hz e o controle DualSense com resposta háptica. Catálogo de exclusivos imbatível na indústria.",
      release: "2023-11-10",
      featured: true,
      rating: 4.8,
      reviewCount: 5432,
      attrs: {
        type: "Console de mesa (com leitor)",
        resolution: "Até 8K / 4K 120 Hz",
        storage: "1 TB SSD",
        processor: "AMD Zen 2 (8 núcleos, 3,5 GHz)",
        gpu: "AMD RDNA 2 (10,28 TFLOPS)",
        connectivity: "Wi-Fi 6, Bluetooth 5.1, HDMI 2.1",
      },
      pros: ["Exclusivos de peso (God of War, Spider-Man)", "SSD ultrarrápido", "DualSense com resposta háptica", "120 Hz em vários títulos"],
      cons: ["Preço dos jogos", "Versão com leitor é maior e mais cara", "Assinatura Plus praticamente obrigatória"],
      offers: [
        { store: "amazon", price: 3699, oldPrice: 4299, coupon: "OFERTA10", shipping: "Frete grátis Prime", best: true },
        { store: "magazine-luiza", price: 3799, oldPrice: 4299, shipping: "Frete grátis" },
        { store: "fast-shop", price: 3899, oldPrice: 4299, shipping: "Frete grátis" },
        { store: "mercado-livre", price: 3999, oldPrice: 4299, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 5,
        pros: "A biblioteca de exclusivos mais forte da indústria",
        cons: "Custo total alto (jogos e assinatura)",
        content:
          "O PS5 Slim é a escolha mais segura em consoles em 2026: catálogo de exclusivos insuperável, SSD que elimina telas de carregamento e o controle DualSense que muda a imersão. A versão com leitor permite comprar mídia usada, o que reduz o custo dos jogos no médio prazo. Em oferta por R$ 3.700, é o momento certo para entrar na nova geração.",
      },
    },
    {
      name: "Nintendo Switch OLED",
      brand: "nintendo",
      category: "games",
      summary: "Console híbrido com tela OLED de 7\" e dock para TV.",
      description:
        "O Switch OLED é o console híbrido da Nintendo com tela OLED de 7 polegadas, 64 GB de armazenamento e dock para jogar na TV. Catálogo familiar incomparável com Mario, Zelda e Pokémon.",
      release: "2021-10-08",
      rating: 4.7,
      reviewCount: 3890,
      attrs: {
        type: "Console híbrido (portátil + dock)",
        resolution: "Até 1080p no dock / 720p portátil",
        storage: "64 GB",
        processor: "NVIDIA Tegra X1 customizado",
        gpu: "NVIDIA Maxwell (1 TFLOP)",
        connectivity: "Wi-Fi 5, Bluetooth, USB-C",
      },
      pros: ["Portátil + TV no mesmo console", "Melhor catálogo familiar", "Tela OLED linda", "Custo de jogos menor (mídia física usada)"],
      cons: ["Hardware defasado (sem 4K)", "Joy-Con drift ainda existe", "Preço elevado para a idade do console"],
      offers: [
        { store: "magazine-luiza", price: 2299, oldPrice: 2699, coupon: "MAGALU5", shipping: "Frete grátis", best: true },
        { store: "amazon", price: 2349, oldPrice: 2699, shipping: "Frete grátis Prime" },
        { store: "americanas", price: 2399, oldPrice: 2699, shipping: "Frete grátis" },
      ],
      editorial: {
        rating: 4,
        pros: "Experiência híbrida única e catálogo familiar",
        cons: "Hardware envelhecido pelo preço",
        content:
          "O Switch OLED segue imbatível no que se propõe: jogar onde quiser. A tela OLED elevou a experiência portátil, o catálogo familiar é o melhor do mercado e a mídia física usada segura os custos. A defasagem de hardware é real — quem busca gráficos 4K deve olhar PS5 ou PC — mas como console de família e viagens, continua a compra mais inteligente da Nintendo.",
      },
    },
  ];

  // Cria produtos e dependências
  const productIds: Record<string, string> = {};
  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        slug: slugify(p.name),
        brandId: brands[p.brand],
        categoryId: categories[p.category],
        summary: p.summary,
        description: p.description,
        imageUrl: `/images/products/${p.category}.svg`,
        releaseDate: new Date(p.release),
        rating: p.rating,
        reviewCount: p.reviewCount,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        pros: {
          create: [
            ...p.pros.map((text, i) => ({ type: "PRO", text, order: i })),
            ...p.cons.map((text, i) => ({ type: "CON", text, order: i })),
          ],
        },
        attributes: {
          create: Object.entries(p.attrs).map(([key, value]) => ({
            attributeId: attrDefs[p.category][key],
            value,
          })),
        },
      },
    });
    productIds[p.name] = product.id;

    // Ofertas
    let bestSet = false;
    for (const o of p.offers) {
      const isBest = o.best === true && !bestSet;
      if (isBest) bestSet = true;
      await prisma.offer.create({
        data: {
          productId: product.id,
          storeId: stores[o.store],
          price: o.price,
          oldPrice: o.oldPrice ?? null,
          url: `${storesData.find((s) => s.slug === o.store)?.url}/oferta-relampago`,
          couponCode: o.coupon ?? null,
          shipping: o.shipping ?? "Frete a calcular",
          isBest,
        },
      });
    }

    // Histórico de preço (random walk determinístico, 365 dias)
    const bestOffer = p.offers.find((o) => o.best) ?? p.offers[0];
    const r = rng(hash(p.name));
    let price = round2(bestOffer.oldPrice ?? bestOffer.price * 1.25);
    const hist: { price: number; recordedAt: Date }[] = [];
    for (let d = 365; d >= 0; d--) {
      const drift = (r() - 0.48) * 0.035; // leve tendência de queda
      const sale = r() > 0.93 ? -0.08 : 0; // quedas pontuais
      price = round2(Math.max(price * (1 + drift + sale), bestOffer.price * 0.85));
      hist.push({ price, recordedAt: daysAgo(d) });
    }
    hist[hist.length - 1].price = bestOffer.price; // termina no preço atual
    await prisma.priceHistory.createMany({
      data: hist.map((h) => ({
        productId: product.id,
        storeId: stores[bestOffer.store],
        price: h.price,
        recordedAt: h.recordedAt,
      })),
    });

    // Review editorial
    if (p.editorial) {
      await prisma.review.create({
        data: {
          productId: product.id,
          authorName: "Redação Oferta Relâmpago",
          title: "Análise do produto",
          content: p.editorial.content,
          rating: p.editorial.rating,
          pros: p.editorial.pros,
          cons: p.editorial.cons,
          verified: true,
        },
      });
    }

    // Reviews de usuários
    for (const u of p.userReviews ?? []) {
      await prisma.review.create({
        data: {
          productId: product.id,
          authorName: u.name,
          title: u.title,
          content: u.content,
          rating: u.rating,
          pros: u.pros ?? null,
          cons: u.cons ?? null,
          verified: true,
        },
      });
    }
  }

  // ─── Ofertas relâmpago (Deals) ─────────────────────────────────────────
  const dealsData = [
    { title: "Samsung Galaxy A17 5G por R$ 1.099", product: "Samsung Galaxy A17 5G", store: "amazon", oldPrice: 1599, price: 1099, coupon: "OFERTA10", endInHours: 7, status: "ACTIVE" },
    { title: "JBL Tune 770NC por R$ 429", product: "JBL Tune 770NC", store: "amazon", oldPrice: 599, price: 429, coupon: "OFERTA10", endInHours: 13, status: "ACTIVE" },
    { title: "Acer Aspire 5 por R$ 2.999", product: "Acer Aspire 5", store: "kabum", oldPrice: 3799, price: 2999, coupon: "KABUM15", endInHours: 26, status: "ACTIVE" },
    { title: "LG OLED C4 65\" por R$ 6.999", product: "LG OLED C4 65", store: "fast-shop", oldPrice: 9999, price: 6999, endInHours: 49, status: "ACTIVE" },
    { title: "PlayStation 5 Slim por R$ 3.699", product: "Sony PlayStation 5 Slim", store: "amazon", oldPrice: 4299, price: 3699, coupon: "OFERTA10", endInHours: 10, status: "ACTIVE" },
    { title: "Brastemp Inverse por R$ 4.499", product: "Brastemp Inverse 443L", store: "casas-bahia", oldPrice: 5499, price: 4499, coupon: "CB10FRE", endInHours: 20, status: "ACTIVE" },
    { title: "Galaxy Buds FE por R$ 399 (agendada)", product: "Samsung Galaxy Buds FE", store: "magazine-luiza", oldPrice: 599, price: 399, endInHours: 72, status: "SCHEDULED" },
    { title: "Redmi Note 14 Pro por R$ 1.299 (expirada)", product: "Xiaomi Redmi Note 14 Pro", store: "amazon", oldPrice: 1699, price: 1299, endInHours: -3, status: "EXPIRED" },
  ];
  for (const d of dealsData) {
    await prisma.deal.create({
      data: {
        title: d.title,
        productId: productIds[d.product],
        storeId: stores[d.store],
        oldPrice: d.oldPrice,
        price: d.price,
        url: "https://www.amazon.com.br/oferta-relampago",
        couponCode: d.coupon ?? null,
        imageUrl: `/images/products/${products.find((p) => p.name === d.product)?.category ?? "celulares"}.svg`,
        startAt: hoursFromNow(-1),
        endAt: hoursFromNow(d.endInHours),
        status: d.status,
      },
    });
  }

  // ─── Cupons ─────────────────────────────────────────────────────────────
  const couponsData = [
    { store: "amazon", code: "OFERTA10", description: "10% de desconto em celulares e eletrônicos selecionados", discount: "10% off", url: "https://www.amazon.com.br/cupons" },
    { store: "magazine-luiza", code: "MAGALU5", description: "5% de desconto em produtos do site com pagamento no PIX", discount: "5% off", url: "https://www.magazineluiza.com.br/cupons" },
    { store: "kabum", code: "KABUM15", description: "15% de desconto em componentes e informática", discount: "15% off", url: "https://www.kabum.com.br/cupons" },
    { store: "casas-bahia", code: "CB10FRE", description: "Frete grátis em eletrodomésticos acima de R$ 99", discount: "Frete grátis", url: "https://www.casasbahia.com.br/cupons" },
    { store: "fast-shop", code: "FAST50", description: "R$ 50 de desconto em compras acima de R$ 999", discount: "R$ 50 off", url: "https://www.fastshop.com.br/cupons" },
  ];
  for (const c of couponsData) {
    await prisma.coupon.create({
      data: { storeId: stores[c.store], code: c.code, description: c.description, discount: c.discount, url: c.url, active: true },
    });
  }

  // ─── Autores ────────────────────────────────────────────────────────────
  const authors = await prisma.author.createMany({
    data: [
      { name: "Ana Souza", slug: "ana-souza", bio: "Redatora de tecnologia há 8 anos, especialista em celulares, notebooks e comparativos. Já escreveu para publicações de tech e e-commerce.", specialty: "Celulares e notebooks", role: "Redatora-chefe" },
      { name: "Carlos Menezes", slug: "carlos-menezes", bio: "Engenheiro eletrônico e entusiasta de áudio e imagem. Cobre TVs, fones e games com foco em medições e testes reais.", specialty: "Áudio, TV e games", role: "Editor de hardware" },
      { name: "Equipe Oferta Relâmpago", slug: "equipe-oferta-relampago", bio: "Time editorial do portal responsável por guias de compra, ofertas e verificação de preços.", specialty: "Guias e preços", role: "Editorial" },
    ],
  });
  const authorIds = await prisma.author.findMany();

  // ─── Categorias de blog (reutiliza Category) ────────────────────────────
  const blogCats = [
    { name: "Notícias", slug: "noticias" },
    { name: "Ofertas", slug: "ofertas" },
    { name: "Comparativos", slug: "comparativos" },
    { name: "Guias de compra", slug: "guias-de-compra" },
    { name: "Tecnologia", slug: "tecnologia" },
    { name: "Casa", slug: "casa" },
    { name: "Informática", slug: "informatica-blog" },
    { name: "Games", slug: "games-blog" },
    { name: "Produtos", slug: "produtos" },
    { name: "Dicas", slug: "dicas" },
  ];
  const blogCatIds: Record<string, string> = {};
  for (const bc of blogCats) {
    const c = await prisma.category.create({ data: { name: bc.name, slug: bc.slug } });
    blogCatIds[bc.slug] = c.id;
  }

  // ─── Artigos ────────────────────────────────────────────────────────────
  type Art = {
    title: string;
    slug: string;
    type: string;
    blogCat: string;
    author: string;
    excerpt: string;
    content: string;
    daysAgoPublished: number;
    products?: string[];
  };

  const art: Art[] = [
    {
      title: "Qual celular comprar em 2026? Guia completo",
      slug: "qual-celular-comprar-2026",
      type: "GUIDE",
      blogCat: "guias-de-compra",
      author: "Ana Souza",
      excerpt: "Do intermediário ao premium: um guia direto para escolher o melhor celular em 2026, com faixas de preço e recomendações.",
      content: `# Qual celular comprar em 2026?

Escolher um celular em 2026 é mais sobre entender o seu uso do que sobre especificações. Este guia divide as recomendações por faixa de preço e perfil de uso.

## Até R$ 1.200 — custo-benefício
O **Samsung Galaxy A17 5G** é a referência: tela Super AMOLED de 120 Hz, bateria de 5.000 mAh e 5G. O **Motorola Moto G85** briga pelo título com câmera com estabilização óptica (OIS), rara na faixa.

## De R$ 1.200 a R$ 1.500 — intermediários premium
O **Xiaomi Redmi Note 14 Pro** entrega câmera de 200 MP, carregamento de 67 W e proteção IP68. É o aparelho mais completo da categoria quando está em oferta.

## De R$ 2.800 a R$ 3.000 — semi-flagships
O **Samsung Galaxy S24 FE** traz Galaxy AI, zoom óptico de 3x e 7 anos de atualizações.

## Acima de R$ 3.500 — premium
O **iPhone 15** e os tops da Samsung e Xiaomi. Para quem valoriza longevidade e câmera, o iPhone é imbatível nas ofertas.

## Regra de ouro
Nunca compre um celular acima de 10% do menor preço histórico. Use o histórico de preços de cada produto nesta página e crie um alerta de preço para ser avisado quando ele cair.

*Este guia é atualizado mensalmente pela redação do Oferta Relâmpago.*`,
      daysAgoPublished: 12,
      products: ["Samsung Galaxy A17 5G", "Motorola Moto G85 5G", "Xiaomi Redmi Note 14 Pro", "Samsung Galaxy S24 FE", "Apple iPhone 15"],
    },
    {
      title: "Melhores celulares até R$ 1.500 em 2026",
      slug: "melhores-celulares-ate-1500",
      type: "BLOG",
      blogCat: "produtos",
      author: "Ana Souza",
      excerpt: "Selecionamos os melhores smartphones até R$ 1.500 com base em testes, ficha técnica e histórico de preços.",
      content: `# Melhores celulares até R$ 1.500

Comparamos dezenas de aparelhos e selecionamos os melhores para cada perfil abaixo de R$ 1.500, sempre considerando o preço médio real dos últimos 90 dias.

## 1. Samsung Galaxy A17 5G — melhor tela
A Super AMOLED de 120 Hz é a melhor da faixa. Em ofertas aparece por R$ 1.099.

## 2. Motorola Moto G85 5G — melhor câmera
O OIS faz diferença real em fotos noturnas e vídeos. 8 GB de RAM e 256 GB de armazenamento.

## 3. Xiaomi Redmi Note 14 Pro — mais completo
200 MP, carregamento de 67 W e IP68. Costuma aparecer por R$ 1.299.

## Como escolhemos
Pesamos ficha técnica, desempenho real em uso, qualidade de câmera, atualizações e o preço médio dos últimos 90 dias nas principais lojas. Nada de especificação de papel que não se sustenta no uso real.`,
      daysAgoPublished: 5,
      products: ["Samsung Galaxy A17 5G", "Motorola Moto G85 5G", "Xiaomi Redmi Note 14 Pro"],
    },
    {
      title: "Celular com melhor custo-benefício: 5 opções que valem a pena",
      slug: "celular-melhor-custo-beneficio",
      type: "BLOG",
      blogCat: "comparativos",
      author: "Ana Souza",
      excerpt: "Custo-benefício não é só preço baixo: é quanto você recebe pelo que paga. Veja nossas 5 escolhas.",
      content: `# Celular com melhor custo-benefício

Custo-benefício é a relação entre o que você paga e o que recebe. Um aparelho de R$ 1.500 que dura 5 anos pode valer mais que um de R$ 900 que trava em 2.

## As 5 escolhas da redação

1. **Samsung Galaxy A17 5G** — tela, bateria e 5G por R$ 1.099.
2. **Motorola Moto G85** — câmera com OIS por R$ 1.199.
3. **Xiaomi Redmi Note 14 Pro** — o pacote mais completo por R$ 1.299.
4. **JBL Tune 770NC** — não é celular, mas é o fone com melhor custo-benefício do Brasil.
5. **Samsung Galaxy S24 FE** — recursos de flagship por R$ 2.899.

## O que evitamos
Aparelhos com processadores fracos, pouca memória ou política curta de atualizações — mesmo quando baratos, o custo por ano de uso sai alto.`,
      daysAgoPublished: 9,
      products: ["Samsung Galaxy A17 5G", "Motorola Moto G85 5G", "Xiaomi Redmi Note 14 Pro", "JBL Tune 770NC", "Samsung Galaxy S24 FE"],
    },
    {
      title: "Melhores notebooks para estudar em 2026",
      slug: "melhores-notebooks-para-estudar-2026",
      type: "GUIDE",
      blogCat: "guias-de-compra",
      author: "Carlos Menezes",
      excerpt: "Estudo, EAD e anotações: veja os melhores notebooks para estudar em 2026 por faixa de preço.",
      content: `# Melhores notebooks para estudar

Para estudo, priorize: 16 GB de RAM (ou 8 GB com possibilidade de upgrade), SSD de 512 GB e boa duração de bateria. Tela IPS faz diferença em leitura prolongada.

## Recomendações

- **Acer Aspire 5 (R$ 2.999)** — o mais equilibrado para estudo e trabalho.
- **Lenovo IdeaPad Slim 3 (R$ 2.899)** — 16 GB de RAM e 1,6 kg para levar para aula.
- **Dell Inspiron 15 (R$ 3.799)** — Core i7 e suporte local.
- **Apple MacBook Air M3 (R$ 8.499)** — o melhor para quem pode investir; bateria de 18h.

## Especificação mínima recomendada em 2026
- 8 GB de RAM (16 GB ideal)
- SSD de 256 GB (512 GB ideal)
- Tela Full HD IPS
- Bateria de 7h ou mais

Evite notebooks com eMMC e 4 GB de RAM: ficam lentos em poucos meses.`,
      daysAgoPublished: 18,
      products: ["Acer Aspire 5", "Lenovo IdeaPad Slim 3", "Dell Inspiron 15", "Apple MacBook Air M3"],
    },
    {
      title: "Qual TV vale a pena comprar? LED, QLED ou OLED",
      slug: "qual-tv-vale-a-pena-comprar",
      type: "GUIDE",
      blogCat: "guias-de-compra",
      author: "Carlos Menezes",
      excerpt: "LED é mais barato, OLED é imbatível em imagem. E o QLED? Entenda a diferença e escolha a TV certa.",
      content: `# Qual TV vale a pena comprar?

## LED (LCD)
A tecnologia mais comum e barata. Bom custo-benefício para salas com muita luz. Exemplo: **Samsung Crystal UHD CU7700 (R$ 2.299)**.

## QLED
LED com camada de pontos quânticos: cores mais vivas e mais brilho. Ideal para ambientes claros e uso diário.

## OLED
Preto absoluto e contraste infinito. A melhor imagem que você pode comprar, ideal para cinema e games. Exemplo: **LG OLED C4 65" (R$ 6.999)**.

## O que mais importa em 2026
- **4K** é o mínimo; 8K não faz sentido pelo preço.
- **HDR**: Dolby Vision e HDR10 fazem diferença real.
- **120 Hz**: essencial para quem joga no PS5/Xbox Series.

## Regra prática
Até R$ 2.500: LED 4K. Até R$ 4.000: QLED/Mini LED. Acima: OLED.`,
      daysAgoPublished: 25,
      products: ["LG OLED C4 65", "Samsung Crystal UHD CU7700 55"],
    },
    {
      title: "Galaxy A17 5G vs Moto G85: qual vale mais a pena?",
      slug: "galaxy-a17-5g-vs-moto-g85",
      type: "BLOG",
      blogCat: "comparativos",
      author: "Ana Souza",
      excerpt: "Dois dos melhores celulares intermediários de 2026 lado a lado: tela, câmera, bateria e preço.",
      content: `# Galaxy A17 5G vs Moto G85

O duelo dos intermediários de 2026 coloca a tela e a bateria do **Galaxy A17** contra a câmera e o design do **Moto G85**.

## Tela
- Galaxy A17: Super AMOLED 6,6" 120 Hz — vence em cores e fluidez.
- Moto G85: pOLED 6,7" 120 Hz — excelente, empate técnico.

## Câmera
- Galaxy A17: 50 MP sem OIS.
- Moto G85: 50 MP **com OIS** — vence em fotos noturnas e vídeos.

## Bateria
- Galaxy A17: 5.000 mAh com carregamento de 25 W.
- Moto G85: 5.000 mAh com carregamento de 33 W — vence por pouco.

## Atualizações
- Galaxy A17: promessa de 4 anos de sistema.
- Moto G85: 2 anos de sistema.

## Veredito
Quer **tela e longevidade**? Galaxy A17. Quer **câmera e design**? Moto G85. Pelo mesmo preço, a decisão é o que você mais usa no celular.`,
      daysAgoPublished: 3,
      products: ["Samsung Galaxy A17 5G", "Motorola Moto G85 5G"],
    },
    {
      title: "Como funcionam as ofertas relâmpago (e como aproveitar)",
      slug: "como-funcionam-ofertas-relampago",
      type: "BLOG",
      blogCat: "ofertas",
      author: "Equipe Oferta Relâmpago",
      excerpt: "Ofertas relâmpago são reais, mas exigem estratégia. Aprenda a identificar as boas e a não cair em armadilhas.",
      content: `# Como funcionam as ofertas relâmpago

Ofertas relâmpago são promoções com tempo limitado — normalmente de 6 a 48 horas — criadas pelas lojas para gerar volume de vendas e liberar estoque.

## Como saber se é uma oferta boa
O desconto percentual é menos importante que o **preço absoluto**. Uma oferta de "50% de desconto" sobre um preço inflado não é oferta.

**Use sempre o histórico de preços**: se o preço atual está no menor patamar dos últimos 90 dias, é uma oferta real.

## Estratégias
1. Crie alertas de preço no produto desejado.
2. Compare o preço relâmpago com o preço médio dos últimos 90 dias.
3. Verifique o frete: uma oferta com frete caro pode não valer a pena.
4. Cupons podem ser acumulados em algumas lojas — teste na hora do checkout.

## O que evitar
- Ofertas "relâmpago" que se repetem todos os dias.
- Descontos sobre preço sugerido (não sobre o preço praticado).
- Compras por impulso: se não estava nos seus planos, não é economia.`,
      daysAgoPublished: 7,
    },
    {
      title: "Guia: como escolher um smartwatch (e não se arrepender)",
      slug: "como-escolher-smartwatch",
      type: "GUIDE",
      blogCat: "guias-de-compra",
      author: "Carlos Menezes",
      excerpt: "Smartwatch completo ou smartband? Guia rápido para escolher o relógio inteligente certo.",
      content: `# Como escolher um smartwatch

## Primeiro: smartwatch ou smartband?
- **Smartband** (como a Xiaomi Smart Band 9): bateria de semanas, monitoramento básico, preço baixo.
- **Smartwatch** (como o Galaxy Watch 7): apps, GPS, ligações e sensores avançados — bateria de 1 a 2 dias.

## O que importa
1. **Compatibilidade**: Watch da Samsung é melhor com Samsung; Apple Watch só com iPhone.
2. **Bateria**: defina quantos dias você aceita carregar.
3. **Sensores**: FC, SpO2, sono e GPS são o essencial.
4. **Resistência à água**: 5 ATM é suficiente para natação.

## Quanto gastar
- Até R$ 300: smartband (melhor custo-benefício).
- R$ 900 a R$ 1.900: smartwatch completo.
- Acima: recursos premium (ECG, LTE) que poucos usam.

A maioria dos usuários fica feliz com uma smartband boa — só suba de categoria se você realmente usa apps e GPS.`,
      daysAgoPublished: 14,
      products: ["Samsung Galaxy Watch 7", "Xiaomi Smart Band 9"],
    },
    {
      title: "Smartphones 5G baratos: ofertas crescem no primeiro semestre",
      slug: "smartphones-5g-baratos-ofertas",
      type: "NEWS",
      blogCat: "noticias",
      author: "Equipe Oferta Relâmpago",
      excerpt: "A chegada de novos processadores 5G de entrada pressionou os preços dos intermediários para baixo em 2026.",
      content: `# Smartphones 5G baratos: ofertas crescem no primeiro semestre

O primeiro semestre de 2026 confirmou a tendência: celulares 5G de entrada e intermediários tiveram as maiores quedas de preço dos últimos anos.

Modelos como o **Samsung Galaxy A17 5G** e o **Xiaomi Redmi Note 14 Pro** foram encontrados por até 31% abaixo do preço de lançamento em ofertas relâmpago.

Segundo o histórico de preços monitorado pelo Oferta Relâmpago, o preço médio dos intermediários 5G caiu 12% em relação a 2025 — reflexo da concorrência entre Samsung, Xiaomi e Motorola na faixa de R$ 1.000 a R$ 1.500.

Para acompanhar as quedas, recomendamos criar alertas de preço nos produtos desejados: as melhores ofertas duram poucas horas.`,
      daysAgoPublished: 1,
      products: ["Samsung Galaxy A17 5G", "Xiaomi Redmi Note 14 Pro"],
    },
    {
      title: "Melhores fones com cancelamento de ruído até R$ 600",
      slug: "melhores-fones-cancelamento-ruido-ate-600",
      type: "BLOG",
      blogCat: "produtos",
      author: "Carlos Menezes",
      excerpt: "ANC deixou de ser luxo: veja os melhores fones com cancelamento de ruído por até R$ 600.",
      content: `# Melhores fones com cancelamento de ruído até R$ 600

O cancelamento de ruído ativo (ANC) deixou de ser exclusividade de fones de R$ 2.000. Testamos as melhores opções até R$ 600.

## 1. JBL Tune 770NC — R$ 429 (over-ear)
70 horas de bateria, ANC eficiente e o melhor custo-benefício do Brasil. A escolha da redação.

## 2. Samsung Galaxy Buds FE — R$ 449 (TWS)
ANC em fone intra-auricular por menos de R$ 500. Graves potentes e conforto.

## Como testamos
Medimos o cancelamento de ruído em ambiente com tráfego e ar-condicionado, além de horas de uso contínuo para avaliar conforto e bateria.

**Conclusão**: por até R$ 600, over-ear com ANC (como o Tune 770NC) ainda oferece melhor custo-benefício que TWS.`,
      daysAgoPublished: 6,
      products: ["JBL Tune 770NC", "Samsung Galaxy Buds FE"],
    },
  ];

  const authorByName = Object.fromEntries(authorIds.map((a) => [a.name, a.id]));
  for (const a of art) {
    const article = await prisma.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        type: a.type,
        categoryId: blogCatIds[a.blogCat],
        authorId: authorByName[a.author],
        coverImage: "/images/blog/" + a.blogCat + ".svg",
        publishedAt: daysAgo(a.daysAgoPublished),
        published: true,
      },
    });
    for (const p of a.products ?? []) {
      await prisma.articleProduct.create({
        data: { articleId: article.id, productId: productIds[p] },
      });
    }
  }

  // ─── Comparações ────────────────────────────────────────────────────────
  const comparisons = [
    {
      slug: "samsung-galaxy-a17-5g-vs-moto-g85",
      title: "Samsung Galaxy A17 5G vs Motorola Moto G85",
      intro:
        "O duelo dos intermediários de 2026: comparamos tela, câmera, bateria, desempenho e preço real nas lojas para você decidir qual comprar.",
      products: ["Samsung Galaxy A17 5G", "Motorola Moto G85 5G"],
    },
    {
      slug: "samsung-galaxy-a17-5g-vs-redmi-note-14-pro-vs-moto-g85",
      title: "Samsung Galaxy A17 5G vs Xiaomi Redmi Note 14 Pro vs Motorola Moto G85",
      intro:
        "Os três melhores celulares intermediários de 2026 em uma comparação completa: ficha técnica, desempenho e custo-benefício lado a lado.",
      products: ["Samsung Galaxy A17 5G", "Xiaomi Redmi Note 14 Pro", "Motorola Moto G85 5G"],
    },
    {
      slug: "lg-oled-c4-65-vs-samsung-crystal-uhd-cu7700",
      title: "LG OLED C4 65 vs Samsung Crystal UHD CU7700",
      intro:
        "OLED de referência contra a TV 4K mais vendida: será que o OLED justifica a diferença de preço? Comparação completa de imagem, games e recursos.",
      products: ["LG OLED C4 65", "Samsung Crystal UHD CU7700 55"],
    },
    {
      slug: "acer-aspire-5-vs-lenovo-ideapad-slim-3-vs-dell-inspiron-15",
      title: "Acer Aspire 5 vs Lenovo IdeaPad Slim 3 vs Dell Inspiron 15",
      intro:
        "Três notebooks para estudo e trabalho comparados: processador, RAM, tela, peso e preço real nas lojas.",
      products: ["Acer Aspire 5", "Lenovo IdeaPad Slim 3", "Dell Inspiron 15"],
    },
  ];
  for (const cmp of comparisons) {
    const comparison = await prisma.comparison.create({
      data: { slug: cmp.slug, title: cmp.title, intro: cmp.intro },
    });
    for (const [i, p] of cmp.products.entries()) {
      await prisma.comparisonItem.create({
        data: { comparisonId: comparison.id, productId: productIds[p], order: i },
      });
    }
  }

  // ─── FAQs ───────────────────────────────────────────────────────────────
  const faqData: { category?: string; question: string; answer: string }[] = [
    { category: "celulares", question: "Qual celular tem melhor custo-benefício em 2026?", answer: "Na faixa até R$ 1.200, o Samsung Galaxy A17 5G lidera por combinar tela Super AMOLED de 120 Hz, bateria de 5.000 mAh e 5G. Até R$ 1.500, o Xiaomi Redmi Note 14 Pro é o mais completo." },
    { category: "celulares", question: "Como saber se o preço de um celular está bom?", answer: "Compare o preço atual com o histórico dos últimos 90 dias na página do produto. Se o preço está no menor patamar do período, é uma boa oferta. Você também pode criar um alerta de preço." },
    { category: "celulares", question: "Vale a pena comprar celular em oferta relâmpago?", answer: "Sim, desde que o preço absoluto esteja abaixo do preço médio histórico. Ofertas relâmpago costumam ser reais, mas sempre confira o histórico de preços antes de comprar." },
    { category: "celulares", question: "Quantos GB de RAM um celular precisa em 2026?", answer: "Para o uso comum, 6 GB é suficiente; para multitarefa pesada e games, 8 GB. Evite aparelhos com menos de 4 GB, que travam com o passar do tempo." },
    { category: "notebooks", question: "Qual a configuração mínima para estudar em 2026?", answer: "8 GB de RAM (16 GB ideal), SSD de 256 GB (512 GB ideal) e tela Full HD IPS. Evite notebooks com eMMC e 4 GB de RAM." },
    { category: "notebooks", question: "Vale a pena esperar promoções para comprar notebook?", answer: "Sim. Notebooks têm quedas históricas em datas como Black Friday, mas boas ofertas relâmpago surgem o ano todo. Crie um alerta de preço e compre quando o valor estiver abaixo do preço médio de 90 dias." },
    { category: "notebooks", question: "Notebook com 8 ou 16 GB de RAM?", answer: "Se o seu uso é navegação, pacote Office e estudo, 8 GB resolve. Para edição, programação ou muitas abas abertas, 16 GB faz diferença real no dia a dia." },
    { category: "televisores", question: "OLED ou QLED: qual comprar?", answer: "OLED entrega o melhor contraste e preto absoluto, ideal para cinema e games em ambientes escuros. QLED tem mais brilho, melhor para salas claras. Pelo mesmo preço, OLED vence em qualidade de imagem." },
    { category: "televisores", question: "Qual tamanho de TV escolher?", answer: "A regra prática: a distância do sofá em metros multiplicada por 30 dá o tamanho ideal em polegadas. A 2,5 metros, uma TV de 65\" é confortável; a 3 metros, 75\"." },
    { category: "televisores", question: "TV de 60 Hz serve para jogar?", answer: "Serve, mas 120 Hz é visivelmente mais fluido em games de ação e esportes. Para quem joga no PS5 ou Xbox Series, priorize 120 Hz com HDMI 2.1." },
    { category: "fones-de-ouvido", question: "O que significa ANC em fones?", answer: "ANC (Active Noise Cancelling) é o cancelamento de ruído ativo: microfones captam o som ambiente e geram uma onda inversa para cancelá-lo. Faz diferença real em transporte público e escritórios." },
    { category: "fones-de-ouvido", question: "Fone over-ear ou TWS?", answer: "Over-ear oferece melhor isolamento, bateria e qualidade de som pelo preço. TWS é mais prático para o dia a dia. Até R$ 600, over-ear com ANC tem melhor custo-benefício." },
  ];
  for (const [i, f] of faqData.entries()) {
    await prisma.faq.create({
      data: {
        categoryId: f.category ? categories[f.category] : null,
        question: f.question,
        answer: f.answer,
        order: i,
      },
    });
  }

  const productFaqs: { product: string; question: string; answer: string }[] = [
    { product: "Samsung Galaxy A17 5G", question: "O Galaxy A17 5G tem carregador na caixa?", answer: "Não. Como outros lançamentos recentes da Samsung, o Galaxy A17 5G não acompanha carregador na caixa. Ele suporta carregamento rápido de 25 W, e qualquer carregador USB-C compatível funciona." },
    { product: "Samsung Galaxy A17 5G", question: "A bateria do Galaxy A17 5G dura quanto tempo?", answer: "Em uso moderado, a bateria de 5.000 mAh dura um dia e meio a dois dias. Em uso intenso com jogos e 5G, um dia completo sem problemas." },
    { product: "Samsung Galaxy A17 5G", question: "O Galaxy A17 5G vale a pena em 2026?", answer: "Sim. Por R$ 1.099 em oferta, é o melhor intermediário da faixa: tela Super AMOLED de 120 Hz, 5G e bateria de 5.000 mAh. Veja o histórico de preços na página para confirmar se a oferta está boa." },
    { product: "Samsung Galaxy A17 5G", question: "Quantos anos de atualização o Galaxy A17 5G recebe?", answer: "A Samsung promete 4 anos de atualizações do sistema Android e 5 anos de patches de segurança para a linha A de 2026." },
    { product: "Acer Aspire 5", question: "O Acer Aspire 5 roda bem para estudar e trabalhar?", answer: "Sim. O Core i5 de 13ª geração com 8 GB de RAM e SSD de 512 GB dá conta de pacote Office, navegação com muitas abas, videochamadas e edição leve de imagens." },
    { product: "Acer Aspire 5", question: "É possível aumentar a RAM do Aspire 5?", answer: "O Aspire 5 tem um slot SODIMM livre, permitindo expandir os 8 GB para 16 ou 24 GB. Verifique a garantia antes de abrir o equipamento." },
    { product: "Acer Aspire 5", question: "O Aspire 5 serve para jogar?", answer: "Para jogos leves e e-sports como League of Legends e CS2 em configurações baixas, sim. Para games pesados, é necessário um notebook com GPU dedicada." },
    { product: "LG OLED C4 65", question: "O que é a tecnologia OLED evo da LG?", answer: "OLED evo é a evolução do painel OLED da LG com maior brilho e melhor eficiência energética. A C4 é uma das TVs com a melhor relação entre qualidade de imagem e preço de 2026." },
    { product: "LG OLED C4 65", question: "A LG OLED C4 é boa para jogar?", answer: "Sim, é referência: 4 HDMI 2.1, 120 Hz (144 Hz em PC), G-Sync e FreeSync. É uma das melhores TVs para consoles de nova geração." },
    { product: "LG OLED C4 65", question: "A OLED C4 sofre com burn-in?", answer: "Os painéis modernos da LG têm medidas contra retenção de imagem, mas conteúdo estático por horas seguidas (logos de canais, HUDs de jogos) ainda pode causar marcas. Use os protetores de tela do webOS em uso de PC." },
    { product: "JBL Tune 770NC", question: "Quanto tempo dura a bateria do JBL Tune 770NC?", answer: "Até 70 horas com o cancelamento de ruído desligado e 44 horas com o ANC ativado. Em uso normal, uma carga dura cerca de duas semanas." },
    { product: "JBL Tune 770NC", question: "O JBL Tune 770NC tem modo transparência?", answer: "Sim, o app JBL Headphones permite alternar entre ANC, modo ambiente e desligado, além de ajustar o equalizador." },
  ];
  for (const [i, f] of productFaqs.entries()) {
    await prisma.productFAQ.create({
      data: { productId: productIds[f.product], question: f.question, answer: f.answer, order: i },
    });
  }

  // ─── Usuário admin inicial ──────────────────────────────────────────────
  await prisma.user.create({
    data: { email: "admin@ofertarelampago.com.br", name: "Administrador", role: "ADMIN" },
  });

  const counts = {
    products: await prisma.product.count(),
    offers: await prisma.offer.count(),
    deals: await prisma.deal.count(),
    articles: await prisma.article.count(),
    comparisons: await prisma.comparison.count(),
    priceHistory: await prisma.priceHistory.count(),
    reviews: await prisma.review.count(),
  };
  console.log("✅ Seed concluído:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
