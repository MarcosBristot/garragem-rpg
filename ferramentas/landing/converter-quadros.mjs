// Converte os PNGs renderizados no Blender em WebP para a landing.
// Uso: node ferramentas/landing/converter-quadros.mjs <renders> [qualidade]
//   <renders>/desktop/quadro_000.png → public/landing/campo/desktop/quadro_000.webp
//   <renders>/mobile/…               → public/landing/campo/mobile/…
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const [renders, qualidade = "60"] = process.argv.slice(2);
if (!renders) throw new Error("Informe a pasta dos renders.");

const destino = fileURLToPath(
  new URL("../../public/landing/campo/", import.meta.url),
);

// Largura final de cada conjunto: no celular, 540×960 fica quase igual na
// tela e pesa metade do 720×1280 renderizado.
const LARGURA = { desktop: 1280, mobile: 540 };

for (const conjunto of ["desktop", "mobile"]) {
  const origem = join(renders, conjunto);
  const saida = join(destino, conjunto);
  mkdirSync(saida, { recursive: true });
  const pngs = readdirSync(origem).filter((n) => /^quadro_\d{3}\.png$/.test(n));
  let bytes = 0;
  for (const nome of pngs) {
    const info = await sharp(join(origem, nome))
      .resize({ width: LARGURA[conjunto] })
      .webp({ quality: Number(qualidade), effort: 6 })
      .toFile(join(saida, nome.replace(".png", ".webp")));
    bytes += info.size;
  }
  console.log(
    `${conjunto}: ${pngs.length} quadros, ${(bytes / 1024 / 1024).toFixed(1)} MB`,
  );
}
