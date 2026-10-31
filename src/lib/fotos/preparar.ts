import "server-only";
import { processarFoto } from "./processar";
import { lerFotoDoFormulario } from "./receber";

/** Lê o arquivo do formulário e processa (sem EXIF/GPS, 3 tamanhos). */
export async function prepararFoto(form: FormData) {
  const recebida = await lerFotoDoFormulario(form);
  if (!recebida.ok) return recebida;
  try {
    return { ok: true as const, foto: await processarFoto(recebida.conteudo) };
  } catch {
    return {
      ok: false as const,
      erro: "Esse arquivo não parece uma foto válida.",
    };
  }
}
