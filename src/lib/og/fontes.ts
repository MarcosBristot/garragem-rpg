import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Fontes para imagens geradas (Open Graph e card de stories). O gerador
// (satori) não lê WOFF2, só TTF/OTF/WOFF; os pacotes @fontsource trazem
// WOFF. Mesmas fontes do site, licença OFL.
const pasta = (pacote: string) =>
  join(process.cwd(), "node_modules", "@fontsource", pacote, "files");

let carregadas: Promise<
  { name: string; data: Buffer; weight: 400 | 600; style: "normal" }[]
> | null = null;

export function fontesOg() {
  carregadas ??= Promise.all([
    readFile(
      join(pasta("instrument-serif"), "instrument-serif-latin-400-normal.woff"),
    ),
    readFile(join(pasta("geist-sans"), "geist-sans-latin-400-normal.woff")),
    readFile(join(pasta("geist-sans"), "geist-sans-latin-600-normal.woff")),
  ]).then(([serif, sans, sansForte]) => [
    { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
    { name: "Geist", data: sans, weight: 400, style: "normal" },
    { name: "Geist", data: sansForte, weight: 600, style: "normal" },
  ]);
  return carregadas;
}
