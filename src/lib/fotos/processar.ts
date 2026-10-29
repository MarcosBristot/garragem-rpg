import "server-only";
import sharp from "sharp";

// Regra inegociável 1: toda foto perde EXIF/GPS no upload. O sharp remove
// todos os metadados por padrão (só manteria com withMetadata, que NUNCA
// deve ser usado aqui). `rotate()` sem argumento aplica a orientação do
// EXIF nos pixels antes de jogar o EXIF fora, para a foto não ficar deitada.

export const TAMANHOS = { mini: 320, feed: 1080, cheia: 2048 } as const;
export type Tamanho = keyof typeof TAMANHOS;

export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
export const BYTES_MAX = 8 * 1024 * 1024;

export type FotoProcessada = {
  largura: number;
  altura: number;
  arquivos: Record<Tamanho, Buffer>;
};

export async function processarFoto(entrada: Buffer): Promise<FotoProcessada> {
  // limitInputPixels: recusa "bombas" de descompressão (imagens gigantes).
  const opcoes = { failOn: "error", limitInputPixels: 60_000_000 } as const;

  const gerados = await Promise.all(
    (Object.keys(TAMANHOS) as Tamanho[]).map(async (nome) => {
      const { data, info } = await sharp(entrada, opcoes)
        .rotate()
        .resize({
          width: TAMANHOS[nome],
          height: TAMANHOS[nome],
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });
      return { nome, data, info };
    }),
  );

  const cheia = gerados.find((g) => g.nome === "cheia")!.info;
  return {
    largura: cheia.width,
    altura: cheia.height,
    arquivos: Object.fromEntries(
      gerados.map((g) => [g.nome, g.data]),
    ) as Record<Tamanho, Buffer>,
  };
}
