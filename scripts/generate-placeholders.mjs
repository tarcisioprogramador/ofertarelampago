// Gera SVGs placeholder de produtos e capas de blog (identidade própria)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "images");

// Paleta por categoria
const CATS = {
  celulares: { accent: "#2563eb", label: "Smartphone" },
  notebooks: { accent: "#7c3aed", label: "Notebook" },
  televisores: { accent: "#0ea5e9", label: "Smart TV" },
  tablets: { accent: "#0891b2", label: "Tablet" },
  smartwatches: { accent: "#059669", label: "Smartwatch" },
  "fones-de-ouvido": { accent: "#d97706", label: "Fone" },
  eletrodomesticos: { accent: "#dc2626", label: "Eletrodoméstico" },
  informatica: { accent: "#475569", label: "Monitor" },
  games: { accent: "#e11d48", label: "Console" },
};

const BLOG = {
  noticias: { accent: "#dc2626", label: "Notícias" },
  ofertas: { accent: "#ea580c", label: "Ofertas" },
  comparativos: { accent: "#7c3aed", label: "Comparativos" },
  "guias-de-compra": { accent: "#2563eb", label: "Guias" },
  tecnologia: { accent: "#0ea5e9", label: "Tecnologia" },
  casa: { accent: "#059669", label: "Casa" },
  "informatica-blog": { accent: "#475569", label: "Informática" },
  "games-blog": { accent: "#e11d48", label: "Games" },
  produtos: { accent: "#d97706", label: "Produtos" },
  dicas: { accent: "#0891b2", label: "Dicas" },
};

// Ícones geométricos simples por categoria
function glyph(cat) {
  switch (cat) {
    case "celulares":
      return `<rect x="145" y="72" width="110" height="216" rx="22" fill="#fff" opacity="0.95"/><rect x="160" y="86" width="80" height="170" rx="8" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/><circle cx="200" cy="268" r="7" fill="${CATS[cat].accent}"/><rect x="185" y="102" width="30" height="6" rx="3" fill="${CATS[cat].accent}"/>`;
    case "notebooks":
      return `<rect x="105" y="95" width="190" height="120" rx="10" fill="#fff" opacity="0.95"/><path d="M70 238h260l-18-32h-224z" fill="${CATS[cat].accent}" opacity="0.85"/><rect x="118" y="108" width="164" height="94" rx="4" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/>`;
    case "televisores":
      return `<rect x="70" y="80" width="260" height="160" rx="12" fill="#fff" opacity="0.95"/><rect x="82" y="92" width="236" height="136" rx="6" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/><rect x="185" y="240" width="30" height="34" fill="${CATS[cat].accent}"/><rect x="155" y="274" width="90" height="10" rx="5" fill="${CATS[cat].accent}"/>`;
    case "tablets":
      return `<rect x="120" y="70" width="160" height="220" rx="18" fill="#fff" opacity="0.95"/><rect x="134" y="84" width="132" height="182" rx="8" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/><circle cx="200" cy="278" r="6" fill="${CATS[cat].accent}"/>`;
    case "smartwatches":
      return `<rect x="140" y="75" width="120" height="210" rx="42" fill="#fff" opacity="0.95"/><rect x="162" y="96" width="76" height="76" rx="38" fill="none" stroke="${CATS[cat].accent}" stroke-width="5"/><path d="M185 136h28M185 148h20" stroke="${CATS[cat].accent}" stroke-width="5" stroke-linecap="round"/>`;
    case "fones-de-ouvido":
      return `<path d="M120 190v-30a80 80 0 0 1 160 0v30" fill="#fff" opacity="0.95"/><rect x="96" y="180" width="52" height="96" rx="24" fill="${CATS[cat].accent}"/><rect x="252" y="180" width="52" height="96" rx="24" fill="${CATS[cat].accent}"/><rect x="150" y="238" width="100" height="14" rx="7" fill="${CATS[cat].accent}"/>`;
    case "eletrodomesticos":
      return `<rect x="110" y="70" width="180" height="220" rx="14" fill="#fff" opacity="0.95"/><rect x="124" y="84" width="152" height="96" rx="6" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/><line x1="124" y1="120" x2="276" y2="120" stroke="${CATS[cat].accent}" stroke-width="4"/><rect x="176" y="200" width="48" height="76" rx="4" fill="${CATS[cat].accent}"/>`;
    case "informatica":
      return `<rect x="90" y="80" width="220" height="140" rx="10" fill="#fff" opacity="0.95"/><rect x="102" y="92" width="196" height="116" rx="6" fill="none" stroke="${CATS[cat].accent}" stroke-width="4"/><path d="M60 240h280l-16 28h-248z" fill="${CATS[cat].accent}" opacity="0.85"/>`;
    case "games":
      return `<rect x="80" y="120" width="240" height="120" rx="24" fill="#fff" opacity="0.95"/><path d="M80 168c0-26 21-48 48-48h144c26 0 48 22 48 48v24c0 26-22 48-48 48h-30l-18-22h-96l-18 22h-30c-26 0-48-22-48-48z" fill="none" stroke="${CATS[cat].accent}" stroke-width="5"/><circle cx="120" cy="168" r="8" fill="${CATS[cat].accent}"/><circle cx="280" cy="168" r="8" fill="${CATS[cat].accent}"/><path d="M146 168h20M150 156v24M234 156h20M238 168h20" stroke="${CATS[cat].accent}" stroke-width="5" stroke-linecap="round"/>`;
    default:
      return `<rect x="130" y="90" width="140" height="180" rx="16" fill="#fff" opacity="0.95"/>`;
  }
}

function svg({ accent, label, cat, blog }) {
  const title = blog ? `Oferta Relâmpago — ${label}` : `${label} · Oferta Relâmpago`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="acc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${accent}"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0.7"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg)"/>
  <circle cx="350" cy="40" r="70" fill="${accent}" opacity="0.06"/>
  <circle cx="40" cy="270" r="90" fill="${accent}" opacity="0.06"/>
  <g transform="translate(0, -8)">${cat ? glyph(cat) : glyph("generic")}</g>
  <text x="200" y="286" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" fill="#475569">${title}</text>
</svg>
`;
}

mkdirSync(join(outDir, "products"), { recursive: true });
mkdirSync(join(outDir, "blog"), { recursive: true });

for (const [slug, meta] of Object.entries(CATS)) {
  writeFileSync(join(outDir, "products", `${slug}.svg`), svg({ ...meta, cat: slug }));
}
for (const [slug, meta] of Object.entries(BLOG)) {
  writeFileSync(join(outDir, "blog", `${slug}.svg`), svg({ ...meta, blog: true }));
}
// Logo do site
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs><linearGradient id="l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff8a00"/><stop offset="1" stop-color="#f43f00"/></linearGradient></defs>
  <rect width="32" height="32" rx="8" fill="url(#l)"/>
  <path d="M19 5 L9 18 h6 l-2 9 L23 13 h-6 z" fill="#fff"/>
</svg>`;
writeFileSync(join(outDir, "logo.svg"), logo);

console.log("✅ SVGs placeholder gerados em /public/images");
