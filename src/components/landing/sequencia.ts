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

/**
 * Ordem de download "do grosso para o fino": primeiro 1 a cada 8 quadros
 * (a volta inteira já fica coberta), depois os do meio. Assim, quem rola
 * rápido logo no começo não vê o carro parado esperando os quadros na ordem.
 */
export function ordemDeCarga(total: number, passo: number): number[] {
  const lista = quadrosParaBaixar(total, passo);
  const vistos = new Set<number>();
  const ordem: number[] = [];
  for (let salto = 8; salto >= 1; salto /= 2) {
    lista.forEach((q, i) => {
      if ((i % salto === 0 || i === lista.length - 1) && !vistos.has(q)) {
        vistos.add(q);
        ordem.push(q);
      }
    });
  }
  return ordem;
}

/**
 * Para a rolagem num ponto entre dois quadros, quais desenhar e quanto do
 * segundo misturar por cima (0 a 1). É o que deixa a volta contínua: sem a
 * mistura, o carro "pula" de um quadro para o outro.
 * Usa os quadros carregados mais próximos de cada lado.
 */
export function misturaDaRolagem(
  progresso: number,
  total: number,
  carregado: (i: number) => boolean,
): { a: number; b: number; mistura: number } | null {
  const p = Math.min(
    1,
    Math.max(0, Number.isFinite(progresso) ? progresso : 0),
  );
  const exato = p * (total - 1);
  let a = -1;
  for (let i = Math.floor(exato); i >= 0; i--) {
    if (carregado(i)) {
      a = i;
      break;
    }
  }
  let b = -1;
  for (let i = Math.ceil(exato); i < total; i++) {
    if (carregado(i)) {
      b = i;
      break;
    }
  }
  if (a < 0 && b < 0) return null;
  if (a < 0) return { a: b, b, mistura: 0 };
  if (b < 0 || b === a) return { a, b: a, mistura: 0 };
  return { a, b, mistura: (exato - a) / (b - a) };
}
