// Normaliza links internos para URLs com barra final (consistente com trailingSlash: true)
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e)) out.push(p);
  }
  return out;
}

const files = walk("src");
let total = 0;

const rules = [
  [/\/busca\?q=/g, "/busca/?q="],
  [/"\/busca"/g, '"/busca/"'],
  [/"\/ofertas-relampago"/g, '"/ofertas-relampago/"'],
  [/"\/ofertas"(?=["? ])/g, '"/ofertas/"'],
  [/"\/comparar"(?=["? ])/g, '"/comparar/"'],
  [/"\/cupons"(?=["? ])/g, '"/cupons/"'],
  [/"\/blog"(?=["? ])/g, '"/blog/"'],
  [/"\/guias"(?=["? ])/g, '"/guias/"'],
  [/"\/sobre"(?=["? ])/g, '"/sobre/"'],
  [/"\/contato"(?=["? ])/g, '"/contato/"'],
  [/"\/afiliados"(?=["? ])/g, '"/afiliados/"'],
  [/"\/politica-de-privacidade"/g, '"/politica-de-privacidade/"'],
  [/"\/termos-de-uso"/g, '"/termos-de-uso/"'],
  [/"\/politica-editorial"/g, '"/politica-editorial/"'],
  [/"\/como-avaliamos"/g, '"/como-avaliamos/"'],
  [/"\/como-funcionam-os-precos"/g, '"/como-funcionam-os-precos/"'],
  [/"\/admin\/produtos"/g, '"/admin/produtos/"'],
  [/"\/admin\/artigos"/g, '"/admin/artigos/"'],
  [/basePath="\/busca"/g, 'basePath="/busca/"'],
  [/'\/busca'/, "'/busca/'"],
];

for (const f of files) {
  let src = readFileSync(f, "utf8");
  const before = src;
  for (const [re, rep] of rules) src = src.replace(re, rep);
  if (src !== before) {
    writeFileSync(f, src);
    total++;
    console.log("updated", f);
  }
}
console.log("Total files updated:", total);
