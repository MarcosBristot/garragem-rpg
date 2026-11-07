// Busca de pessoas: o texto digitado vira um termo seguro para o filtro do
// banco. Fica só com letras (com acento), números, espaço, _ e -: vírgula,
// ponto, parênteses e % mudariam o sentido do filtro.

export const MAX_BUSCA = 40;

export function termoBusca(entrada: unknown): string | null {
  if (typeof entrada !== "string") return null;
  const termo = entrada
    .replace(/^\s*@/, "") // "@fulano" busca "fulano"
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_BUSCA);
  return termo.length >= 2 ? termo : null;
}
