// Trajetória da câmera na landing: funções puras (sem three.js), testadas.

export type Vetor = [number, number, number];
export type Quadro = { p: number; pos: Vetor; alvo: Vetor };

/** Curva "ease in-out": começa e termina devagar. */
export function suavizar(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

function misturar(a: Vetor, b: Vetor, t: number): Vetor {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Posição e alvo da câmera no progresso p (0 a 1), interpolando entre os
 * dois quadros vizinhos. `quadros` deve estar em ordem crescente de p.
 */
export function quadroEm(
  quadros: Quadro[],
  p: number,
): { pos: Vetor; alvo: Vetor } {
  const progresso = Math.min(1, Math.max(0, p));
  // Último quadro cujo p é <= progresso (no fim, o penúltimo par).
  let i = 0;
  while (i < quadros.length - 2 && quadros[i + 1].p <= progresso) i++;
  const a = quadros[i];
  const b = quadros[i + 1] ?? a;
  const t = b.p === a.p ? 1 : suavizar((progresso - a.p) / (b.p - a.p));
  return { pos: misturar(a.pos, b.pos, t), alvo: misturar(a.alvo, b.alvo, t) };
}
