// Roda no navegador, antes do envio: reduz a foto para no máximo 2560 px
// e converte para JPEG. Ganhos: envio rápido no 4G, cabe no limite de
// envio (BYTES_MAX) e converte HEIC (iPhone), que o servidor não lê.
// Não substitui o servidor: lá a foto é reprocessada e perde EXIF/GPS.

import { BYTES_MAX } from "./limites";

const LADO_MAXIMO = 2560;
// Foto com muito detalhe pode passar do limite: baixa a qualidade aos poucos.
const QUALIDADES = [0.88, 0.8, 0.7, 0.6];

export async function reduzirNoNavegador(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, {
    imageOrientation: "from-image",
  });
  const escala = Math.min(
    1,
    LADO_MAXIMO / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Navegador sem suporte a canvas.");
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | undefined;
  for (const qualidade of QUALIDADES) {
    blob = await paraJpeg(canvas, qualidade);
    if (blob.size <= BYTES_MAX) break;
  }
  // Se nem a menor qualidade couber, o servidor recusa com mensagem clara.
  return blob!;
}

function paraJpeg(canvas: HTMLCanvasElement, qualidade: number): Promise<Blob> {
  return new Promise((resolver, rejeitar) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolver(blob) : rejeitar(new Error("Falha ao converter.")),
      "image/jpeg",
      qualidade,
    ),
  );
}
