import "server-only";
import sharp from "sharp";
import { baixarFoto } from "@/lib/fotos/armazenamento";

/**
 * Foto pronta para imagens geradas (OG, card): o servidor baixa do
 * armazenamento e entrega como data URL JPEG no tamanho exato. O gerador
 * não busca URLs (ele bloqueia endereços internos por segurança) e a foto
 * já não tem EXIF desde o upload.
 */
export async function fotoParaImagem(
  chave: string,
  largura: number,
  altura: number,
): Promise<string | null> {
  try {
    const original = await baixarFoto(chave, "feed");
    const jpeg = await sharp(original)
      .resize(largura, altura, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null; // sem foto, a imagem sai com o símbolo no lugar
  }
}
