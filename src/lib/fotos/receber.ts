import "server-only";
import { BYTES_MAX, ROTULO_BYTES_MAX } from "./limites";
import { TIPOS_ACEITOS } from "./processar";

export type FotoRecebida =
  { ok: true; conteudo: Buffer } | { ok: false; erro: string };

/** Lê e confere o arquivo enviado. O tipo é reconferido pelo sharp depois. */
export async function lerFotoDoFormulario(
  form: FormData,
  campo = "foto",
): Promise<FotoRecebida> {
  const arquivo = form.get(campo);
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, erro: "Escolha uma foto." };
  }
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { ok: false, erro: "Use uma foto JPG, PNG ou WebP." };
  }
  if (arquivo.size > BYTES_MAX) {
    return {
      ok: false,
      erro: `Foto grande demais (máximo de ${ROTULO_BYTES_MAX}).`,
    };
  }
  return { ok: true, conteudo: Buffer.from(await arquivo.arrayBuffer()) };
}
