import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Fontes para imagens geradas (Open Graph e card de stories). O gerador
// (satori) não lê WOFF2, só TTF/OTF/WOFF; os pacotes @fontsource trazem
// WOFF. Mesmas fontes do site (Barlow e Barlow Semi Condensed), licença OFL.
const pasta = (pacote: string) =>
  join(process.cwd(), "node_modules", "@fontsource", pacote, "files");

let carregadas: Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
> | null = null;

export function fontesOg() {
  carregadas ??= Promise.all([
    readFile(
      join(
        pasta("barlow-semi-condensed"),
        "barlow-semi-condensed-latin-700-normal.woff",
      ),
    ),
    readFile(join(pasta("barlow"), "barlow-latin-400-normal.woff")),
    readFile(join(pasta("barlow"), "barlow-latin-600-normal.woff")),
  ]).then(([titulo, texto, textoForte]) => [
    {
      name: "Barlow Semi Condensed",
      data: titulo,
      weight: 600,
      style: "normal",
    },
    { name: "Barlow", data: texto, weight: 400, style: "normal" },
    { name: "Barlow", data: textoForte, weight: 600, style: "normal" },
  ]);
  return carregadas;
}
