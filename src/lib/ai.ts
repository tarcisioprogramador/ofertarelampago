import { fetchMeliProduct } from "./meli-importer";

/** Dados gerados pela IA para criar a página completa do produto. */
export type AiProductDraft = {
  name: string;
  slug: string;
  summary: string;
  description: string;
  imageUrl: string;
  galleryImages: string[];
  attributes: Record<string, string>;
  pros: string[];
  cons: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
};

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/** Extrai o primeiro objeto JSON válido de uma resposta do modelo (tolera code fences). */
function parseJson(text: string): Record<string, unknown> | null {
  const clean = text.replace(/```(?:json)?/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter((x) => x.length > 0)
    .slice(0, 12);
}

function asNumber(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export type AiGenerateInput = {
  link: string;
  description: string;
  photos: string[];
  category: { name: string; attributeDefs: { key: string; name: string }[] };
  meliData?: Awaited<ReturnType<typeof fetchMeliProduct>> | null;
};

/**
 * Chama a API de IA (formato OpenAI, configurável) para gerar a página completa
 * de um produto a partir de um link, descrição e/ou fotos. NUNCA inventa dados
 * que não foram informados — dados não confirmados viram campos vazios.
 */
export async function generateProductDraftWithAi(input: AiGenerateInput): Promise<AiProductDraft> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("Chave de IA não configurada. Defina AI_API_KEY no .env (e na Vercel).");

  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const attrsPrompt =
    input.category.attributeDefs.map((d) => `- ${d.name} (chave: ${d.key})`).join("\n") || "(nenhum campo específico desta categoria)";

  const meliInfo = input.meliData
    ? [
        "Dados REAIS extraídos do link informado (use-os, não os invente):",
        `- Nome oficial: ${input.meliData.name}`,
        `- Preço atual: R$ ${input.meliData.price.toFixed(2).replace(".", ",")}`,
        input.meliData.oldPrice ? `- Preço anterior: R$ ${input.meliData.oldPrice.toFixed(2).replace(".", ",")}` : "",
        input.meliData.imageUrl ? `- Imagem principal: ${input.meliData.imageUrl}` : "",
        `- Link da oferta: ${input.meliData.productUrl}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "";

  const system = `Você é um editor sênior de e-commerce, SEO e marketing de afiliados do portal "Oferta Relâmpago".
Sua missão: criar a página completa de UM produto, com qualidade editorial alta, texto original (nunca copie a descrição da loja) e dados reais.
REGRAS OBRIGATÓRIAS:
1. NUNCA invente preço, desconto, avaliação, especificação, estoque ou disponibilidade. Se um dado não foi informado, deixe o campo vazio (string vazia) — nunca fabrique.
2. Descrição com 3 a 4 parágrafos (250 a 400 palavras) em COPY DE ALTA CONVERSÃO, respondendo: o que é, para quem é, principais recursos E SEUS BENEFÍCIOS (o que o usuário ganha no dia a dia), além do custo-benefício. Destaque os pontos fortes do produto de forma persuasiva, mas sempre honesta.
3. Ficha técnica (attributes): preencha SOMENTE os valores que dá para deduzir com segurança das informações reais fornecidas. Campos desconhecidos ficam com string vazia.
4. Tags SEO: 6 a 14 tags relevantes (produto, modelo, capacidade, categoria, "vale a pena", "preço", "promoção", marca + categoria).
5. Pros/contras: 3 a 5 pontos cada, objetivos e sem exagero.
6. Responda EXCLUSIVAMENTE com um objeto JSON válido — sem texto, sem markdown, sem comentários.`;

  const user = `Crie a página completa do produto.

Categoria: ${input.category.name}

${meliInfo}

${input.link ? `Link informado pelo administrador: ${input.link}` : ""}
${input.description ? `Descrição/observações do administrador:\n${input.description}` : ""}
${input.photos.length ? `Fotos fornecidas pelo administrador (use todas na galeria "galleryImages"):\n${input.photos.join("\n")}` : ""}

Campos da ficha técnica a preencher (chave: nome):
${attrsPrompt}

Formato EXATO de resposta (JSON apenas):
{
  "name": "nome oficial do produto",
  "slug": "slug amigável em minúsculas com hífens",
  "summary": "resumo curto (1 a 2 frases, aparece em buscas)",
  "description": "3 a 4 parágrafos separados por \\n\\n",
  "imageUrl": "melhor URL de imagem disponível (ou vazia)",
  "galleryImages": ["urls de fotos"],
  "attributes": { "chave": "valor" },
  "pros": ["ponto positivo"],
  "cons": ["ponto negativo"],
  "tags": ["tag1", "tag2"],
  "rating": 0,
  "reviewCount": 0
}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 2200,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Erro na API de IA (HTTP ${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? "";
  const json = parseJson(content);
  if (!json) throw new Error("A IA não retornou um JSON válido. Tente novamente.");

  const gallery = asStringList(json.galleryImages);
  const userPhotos = input.photos.filter((u) => !gallery.includes(u));
  const allImages = [...gallery, ...userPhotos].slice(0, 10);

  const name = asString(json.name, input.meliData?.name ?? input.link);
  if (!name) throw new Error("A IA não identificou o nome do produto.");

  return {
    name,
    slug: asString(json.slug, name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
    summary: asString(json.summary),
    description: asString(json.description),
    imageUrl: asString(json.imageUrl, input.meliData?.imageUrl ?? ""),
    galleryImages: allImages,
    attributes: Object.fromEntries(
      input.category.attributeDefs.map((d) => [d.key, asString((json.attributes as Record<string, unknown> | undefined)?.[d.key])])
    ),
    pros: asStringList(json.pros),
    cons: asStringList(json.cons),
    tags: asStringList(json.tags),
    rating: asNumber(json.rating, 0, 5, 0),
    reviewCount: Math.round(asNumber(json.reviewCount, 0, 1000000, 0)),
  };
}
