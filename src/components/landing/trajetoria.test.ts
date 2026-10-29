import { describe, expect, it } from "vitest";
import { quadroEm, suavizar, type Quadro } from "./trajetoria";

const QUADROS: Quadro[] = [
  { p: 0, pos: [0, 0, 0], alvo: [0, 0, 0] },
  { p: 0.5, pos: [10, 0, 0], alvo: [0, 1, 0] },
  { p: 1, pos: [10, 10, 0], alvo: [0, 2, 0] },
];

describe("suavizar", () => {
  it("vai de 0 a 1 e trava fora do intervalo", () => {
    expect(suavizar(0)).toBe(0);
    expect(suavizar(0.5)).toBe(0.5);
    expect(suavizar(1)).toBe(1);
    expect(suavizar(-3)).toBe(0);
    expect(suavizar(7)).toBe(1);
  });
});

describe("quadroEm", () => {
  it("nos pontos-chave devolve o próprio quadro", () => {
    expect(quadroEm(QUADROS, 0).pos).toEqual([0, 0, 0]);
    expect(quadroEm(QUADROS, 0.5).pos).toEqual([10, 0, 0]);
  });

  it("no fim da página fica no último quadro (bug: voltava ao início)", () => {
    expect(quadroEm(QUADROS, 1)).toEqual({ pos: [10, 10, 0], alvo: [0, 2, 0] });
  });

  it("no meio de um trecho interpola", () => {
    expect(quadroEm(QUADROS, 0.25).pos).toEqual([5, 0, 0]);
  });

  it("trava progresso fora de 0..1", () => {
    expect(quadroEm(QUADROS, -1).pos).toEqual([0, 0, 0]);
    expect(quadroEm(QUADROS, 2).pos).toEqual([10, 10, 0]);
  });
});
