import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Fontes para imagens geradas (Open Graph e card de stories). O gerador
// (satori) não lê WOFF2, só TTF/OTF/WOFF; os pacotes @fontsource trazem
// WOFF. Mesmas fontes do site (Pixelify Sans e Chakra Petch), licença OFL.
const pasta = (pacote: string) =>
  join(process.cwd(), "node_modules", "@fontsource", pacote, "files");

let carregadas: Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
> | null = null;

export function fontesOg() {
  carregadas ??= Promise.all([
    readFile(
      join(pasta("pixelify-sans"), "pixelify-sans-latin-600-normal.woff"),
    ),
    readFile(join(pasta("chakra-petch"), "chakra-petch-latin-400-normal.woff")),
    readFile(join(pasta("chakra-petch"), "chakra-petch-latin-600-normal.woff")),
  ]).then(([pixel, texto, textoForte]) => [
    { name: "Pixelify Sans", data: pixel, weight: 600, style: "normal" },
    { name: "Chakra Petch", data: texto, weight: 400, style: "normal" },
    { name: "Chakra Petch", data: textoForte, weight: 600, style: "normal" },
  ]);
  return carregadas;
}
