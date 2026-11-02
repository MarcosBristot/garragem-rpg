// Post do feed: publicado de propósito, sempre de um carro próprio e
// público (a RLS confere de novo no banco). Espelha os CHECKs de `posts`.

export const MAX_FOTOS_POST = 4;
export const MAX_LEGENDA = 2000;
export const MAX_DESCRICAO_FOTO = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResultadoPost =
  | { ok: true; dados: { carroId: string; legenda: string | null } }
  | { ok: false; erros: { carro?: string; legenda?: string } };

export function validarPost(entrada: {
  carroId: unknown;
  legenda: unknown;
}): ResultadoPost {
  const carroId = String(entrada.carroId ?? "");
  const legenda = String(entrada.legenda ?? "").trim();
  const erros: { carro?: string; legenda?: string } = {};
  if (!UUID.test(carroId)) erros.carro = "Escolha o carro do post.";
  if (legenda.length > MAX_LEGENDA) {
    erros.legenda = `Máximo de ${MAX_LEGENDA.toLocaleString("pt-BR")} caracteres.`;
  }
  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return { ok: true, dados: { carroId, legenda: legenda || null } };
}

/** Descrição da foto (texto alternativo): opcional, cortada no limite. */
export function limparDescricao(valor: unknown): string | null {
  const texto = String(valor ?? "")
    .trim()
    .slice(0, MAX_DESCRICAO_FOTO);
  return texto || null;
}
