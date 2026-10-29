// Roda no navegador, antes do envio: reduz a foto para no máximo 2560 px
// e converte para JPEG. Ganhos: envio rápido no 4G, cabe no limite das
// Server Actions e converte HEIC (iPhone), que o servidor não lê.
// Não substitui o servidor: lá a foto é reprocessada e perde EXIF/GPS.

const LADO_MAXIMO = 2560;

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

  return new Promise((resolver, rejeitar) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolver(blob) : rejeitar(new Error("Falha ao converter.")),
      "image/jpeg",
      0.88,
    ),
  );
}
