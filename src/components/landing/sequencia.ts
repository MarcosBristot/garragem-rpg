// Sequência de quadros da landing (o carro no campo de flores, renderizado
// no Blender). A rolagem escolhe o quadro, como nas páginas de produto que
// "giram" o objeto. Funções puras, testadas; o componente só desenha.

export const TOTAL_QUADROS = 48;

/** Caminho de um quadro: "/landing/campo/desktop/quadro_007.webp". */
export function caminhoQuadro(
  conjunto: "desktop" | "mobile",
  i: number,
): string {
  return `/landing/campo/${conjunto}/quadro_${String(i).padStart(3, "0")}.webp`;
}

/**
 * Quais quadros baixar: todos, ou um a cada `passo` (celular com economia
 * de dados). O primeiro e o último entram sempre.
 */
export function quadrosParaBaixar(total: number, passo: number): number[] {
  const lista: number[] = [];
  for (let i = 0; i < total; i += Math.max(1, passo)) lista.push(i);
  if (lista[lista.length - 1] !== total - 1) lista.push(total - 1);
  return lista;
}

/**
 * Quadro a mostrar para um progresso de rolagem (0 a 1). Se o quadro ideal
 * ainda não chegou, usa o carregado mais próximo (a imagem nunca some).
 * Devolve -1 se nada carregou.
 */
export function quadroDaRolagem(
  progresso: number,
  total: number,
  carregado: (i: number) => boolean,
): number {
  const p = Math.min(
    1,
    Math.max(0, Number.isFinite(progresso) ? progresso : 0),
  );
  const ideal = Math.round(p * (total - 1));
  for (let d = 0; d < total; d++) {
    if (ideal - d >= 0 && carregado(ideal - d)) return ideal - d;
    if (ideal + d < total && carregado(ideal + d)) return ideal + d;
  }
  return -1;
}

/**
 * Enquadramento "cover" (como object-fit: cover): a imagem cobre a tela
 * inteira, centralizada, cortando o que sobrar. `focoY` desloca o corte na
 * vertical (0 = topo, 0,5 = centro, 1 = base).
 */
export function cobrir(
  imgL: number,
  imgA: number,
  telaL: number,
  telaA: number,
  focoY = 0.5,
): { x: number; y: number; l: number; a: number } {
  const escala = Math.max(telaL / imgL, telaA / imgA);
  const l = imgL * escala;
  const a = imgA * escala;
  // "+ 0" troca -0 por 0 (com foco 0 a conta dá -0).
  return { x: (telaL - l) / 2 + 0, y: (telaA - a) * focoY + 0, l, a };
}
