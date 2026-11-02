// Comentário em post do feed. Espelha o CHECK de `comentarios`.

export const MAX_COMENTARIO = 500;

export type ResultadoComentario =
  { ok: true; texto: string } | { ok: false; erro: string };

export function validarComentario(valor: unknown): ResultadoComentario {
  // Linhas em branco seguidas viram uma só: evita "paredes" vazias.
  const texto = String(valor ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (texto.length === 0) return { ok: false, erro: "Escreva um comentário." };
  if (texto.length > MAX_COMENTARIO) {
    return { ok: false, erro: `Máximo de ${MAX_COMENTARIO} caracteres.` };
  }
  return { ok: true, texto };
}
