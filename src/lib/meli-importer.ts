export type MeliProductData = {
  name: string;
  price: number;
  oldPrice: number | null;
  imageUrl: string | null;
  productUrl: string;
  itemId: string | null;
};

function unescapeMeli(html: string): string {
  return html.replace(/\\u002F/gi, "/").replace(/&amp;/g, "&");
}

/** Extrai o conteúdo de uma meta tag (og:title, og:image) do HTML. */
function metaContent(html: string, property: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"));
  if (m) return m[1];
  const m2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"));
  return m2 ? m2[1] : null;
}

/** Extrai o preço à vista do produto: o JSON embutido usa "price":758.7 (número direto). */
function extractPrice(html: string): number | null {
  // Preço à vista aparece como "price":758.7 (sem objeto). Fallback para "value".
  const m = html.match(/"price"\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (m) return Number(m[1]);
  const m2 = html.match(/"price"\s*:\s*\{\s*"value"\s*:\s*([0-9.]+)/i);
  return m2 ? Number(m2[1]) : null;
}

/** Extrai o preço anterior (previous_price.value). */
function extractOldPrice(html: string): number | null {
  const m = html.match(/"previous_price"\s*:\s*\{\s*"value"\s*:\s*([0-9.]+)/i);
  return m ? Number(m[1]) : null;
}

/**
 * Extrai a URL real do produto (mercadolivre.com.br/.../p/MLB...) PRESERVANDO os
 * parâmetros de afiliado que vêm no link meli.la.
 *
 * No HTML do ML, o tracking de afiliado fica no FRAGMENTO da URL:
 *   .../p/MLB55034955?pdp_filters=...&matt_event_ts=...#matt_tool_id=93262014&source=affiliate-profile&tracking_id=...
 * Então precisamos manter o fragmento — ele é parte legítima do link de afiliado.
 */
function extractProductUrl(html: string): string | null {
  const clean = unescapeMeli(html);
  // Primeira tentativa: URL com path do produto + query/fragmento de afiliado
  const m = clean.match(/https?:\/\/(?:www\.)?mercadolivre\.com\.br\/[a-z0-9-]+\/(?:p\/)?MLB[0-9]+[^"'\\\s)]*/i);
  if (m) {
    const raw = m[0];
    const [base, hash = ""] = raw.split("?")[0].split("#");
    // Query string (antes do fragmento)
    const q = raw.match(/\?([^#]*)/)?.[1] ?? "";
    const query = q ? `?${q}` : "";
    // Fragmento com tracking de afiliado
    const frag = hash || (raw.includes("#") ? raw.split("#")[1] : "");
    const out = `${base}${query}${frag ? `#${frag}` : ""}`;
    // Mantém a URL completa sempre que houver rastro de afiliado (query ou fragmento)
    if (/(matt_tool_id|matt_tool|matt_word|ref|source=affiliate-profile)/i.test(out)) return out;
    return `${base}${query}`;
  }
  const m2 = clean.match(/mercadolivre\.com\.br\/(celular-|smartphone-|notebook-|tv-|tablet-|fone-|caixa-|monitor-|geladeira-|smartwatch-|playstation-|nintendo-|iphone-|ipad-|macbook-|dell-|lenovo-|acer-|lg-|samsung-|xiaomi-|motorola-|jbl-|sony-|apple-|brastemp-)[a-z0-9-]+\/p\/MLB[0-9]+/i);
  return m2 ? `https://www.${m2[0]}` : null;
}

function extractItemId(html: string): string | null {
  const m = html.match(/MLB[0-9]{6,}/);
  return m ? m[0] : null;
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/^Celular\s+/i, "")
    .trim();
}

/**
 * Busca a página de um link de afiliado do Mercado Livre (meli.la/...) e
 * extrai os dados do produto para importação.
 */
export async function fetchMeliProduct(affiliateUrl: string): Promise<MeliProductData | null> {
  let res: Response;
  try {
    res = await fetch(affiliateUrl.trim(), {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
        "accept-language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();

  const name = cleanName(metaContent(html, "og:title") ?? "");
  const price = extractPrice(html);
  if (!name || !price) return null;

  const productUrl = extractProductUrl(html);
  if (!productUrl) return null;

  return {
    name,
    price,
    oldPrice: extractOldPrice(html),
    imageUrl: metaContent(html, "og:image"),
    productUrl,
    itemId: extractItemId(html),
  };
}
