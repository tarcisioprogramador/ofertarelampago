export const SITE_NAME = "Oferta Relâmpago";
export const SITE_TAGLINE = "Ofertas, preços e informações para você comprar melhor";

export function siteUrl(path = "") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Anexa (ou preserva) um parâmetro de query a uma URL, sem duplicar e sem quebrar fragmentos. */
function appendQuery(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  const [base, fragment = ""] = url.split("#");
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}${key}=${encodeURIComponent(value)}${fragment ? `#${fragment}` : ""}`;
}

/** Identifica a loja parceira de uma URL (para exibir no gerador de links). */
export function detectStore(url: string | null | undefined): "mercado-livre" | "amazon" | "magazine-luiza" | null {
  if (!url) return null;
  const host = url.replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase();
  if (host === "mercadolivre.com.br" || host.endsWith(".mercadolivre.com.br") || host === "mercadolivre.com" || host.endsWith(".mercadolivre.com")) return "mercado-livre";
  if (host === "amazon.com.br" || host.endsWith(".amazon.com.br")) return "amazon";
  if (host === "magazineluiza.com.br" || host.endsWith(".magazineluiza.com.br")) return "magazine-luiza";
  return null;
}

/** Nome amigável da loja detectada. */
export function storeLabel(store: string | null | undefined): string {
  switch (store) {
    case "mercado-livre":
      return "Mercado Livre";
    case "amazon":
      return "Amazon";
    case "magazine-luiza":
      return "Magazine Luiza";
    default:
      return "Loja não reconhecida";
  }
}

/**
 * Aplica o tracking de afiliado a URLs de ofertas, por loja:
 * - Mercado Livre:  ?matt_tool=SEU_ID        (env MELI_AFFILIATE_ID)
 * - Amazon Brasil:  ?tag=SEU-ID-21           (env AMAZON_AFFILIATE_TAG)
 * - Magazine Luiza: parceiromagalu.com.br/SEU-SLUG/... (env MAGALU_AFFILIATE_SLUG)
 *
 * Se a URL já contém tracking completo do ML (matt_word/ref de um link meli.la),
 * ela é preservada — nunca quebramos um link de afiliado válido.
 */
export function affiliateUrl(url: string | null | undefined): string {
  if (!url) return "#";
  const store = detectStore(url);

  // Mercado Livre
  const meli = process.env.MELI_AFFILIATE_ID;
  if (store === "mercado-livre" && meli) {
    // Link já veio com tracking completo (importado de meli.la) — preserva tudo e só completa o que falta
    let out = url;
    if (!/(?:matt_tool|matt_word|ref|matt_tool_id)=/i.test(out)) out = appendQuery(out, "matt_tool", meli);
    // matt_word: palavra-chave da campanha do afiliado (fontenelle413)
    const meliWord = process.env.MELI_AFFILIATE_WORD;
    if (meliWord && !/(?:matt_word)=/i.test(out)) out = appendQuery(out, "matt_word", meliWord);
    return out;
  }

  // Amazon Brasil
  const amazon = process.env.AMAZON_AFFILIATE_TAG;
  if (store === "amazon" && amazon) return appendQuery(url, "tag", amazon);

  // Magazine Luiza — reescreve o domínio para o link de parceiro
  const magalu = process.env.MAGALU_AFFILIATE_SLUG;
  if (store === "magazine-luiza" && magalu) {
    const path = url.split(/[?#]/)[0].replace(/^https?:\/\/(www\.)?magazineluiza\.com\.br/i, "");
    return `https://www.parceiromagalu.com.br/${encodeURIComponent(magalu)}${path}?utm_source=${encodeURIComponent(magalu)}`;
  }

  return url;
}

/** Formata 1099 -> R$ 1.099,00 */
export function formatBRL(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Formata 1099 -> 1.099 (sem moeda) */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString("pt-BR");
}

export function percentOff(oldPrice: number | null | undefined, price: number | null | undefined): number | null {
  if (!oldPrice || !price || oldPrice <= 0 || price <= 0 || price >= oldPrice) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function formatDate(date: Date | string | null | undefined, withTime = false): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Tempo restante de uma oferta relâmpago, como "07h 32min 18s" */
export function timeLeft(endsAt: Date | string, now = new Date()): { hours: string; minutes: string; seconds: string; expired: boolean } {
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  let diff = Math.max(0, end.getTime() - now.getTime());
  const expired = end.getTime() <= now.getTime();
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    expired,
  };
}

export function truncate(text: string, max = 140): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
