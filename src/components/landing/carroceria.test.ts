import { describe, expect, it } from "vitest";
import {
  ARCO_RAIO,
  COMPRIMENTO,
  curva,
  EIXO_DIANTEIRO,
  pontoCarroceria,
  RODA_RAIO,
} from "./carroceria";

function amostrar(passos = 80) {
  const pontos: [number, number, number][] = [];
  for (let i = 0; i <= passos; i++) {
    for (let j = 0; j <= passos; j++) {
      pontos.push(pontoCarroceria(i / passos, j / passos));
    }
  }
  return pontos;
}

describe("curva (interpolação monótona)", () => {
  it("passa pelos pontos e não ultrapassa os vizinhos", () => {
    const p = [
      [0, 0],
      [1, 1],
      [2, 1],
      [3, 0],
    ] as const;
    expect(curva(p, 1)).toBeCloseTo(1);
    for (let x = 1; x <= 2; x += 0.1) {
      expect(curva(p, x)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe("carroceria", () => {
  const pontos = amostrar();
  const max = (i: number) => Math.max(...pontos.map((p) => p[i]));
  const min = (i: number) => Math.min(...pontos.map((p) => p[i]));

  it("tem medidas de um esportivo (4,5 m × 1,9 m × 1,26 m)", () => {
    expect(max(0) - min(0)).toBeCloseTo(COMPRIMENTO, 1);
    expect(max(2) - min(2)).toBeGreaterThan(1.85);
    expect(max(2) - min(2)).toBeLessThan(2.0);
    expect(max(1)).toBeGreaterThan(1.2);
    expect(max(1)).toBeLessThan(1.32);
  });

  it("fica acima do chão (vão livre de ~18 cm)", () => {
    expect(min(1)).toBeGreaterThan(0.15);
  });

  it("é simétrica: lado esquerdo espelha o direito", () => {
    for (const u of [0.2, 0.5, 0.8]) {
      const [, yd, zd] = pontoCarroceria(u, 0.3);
      const [, ye, ze] = pontoCarroceria(u, 0.7);
      expect(ye).toBeCloseTo(yd, 6);
      expect(ze).toBeCloseTo(-zd, 6);
    }
  });

  it("a borda de fora sobe no arco: a roda fica à mostra", () => {
    const u = (EIXO_DIANTEIRO + COMPRIMENTO / 2) / COMPRIMENTO;
    const [, y] = pontoCarroceria(u, 0.2); // lateral, embaixo
    expect(y).toBeGreaterThanOrEqual(RODA_RAIO + ARCO_RAIO - 1e-6);
  });

  it("o teto é mais estreito que a lataria (cintura do teto)", () => {
    const larguraEm = (u: number, v: number) =>
      Math.abs(pontoCarroceria(u, v)[2]);
    expect(larguraEm(0.45, 0.42)).toBeLessThan(larguraEm(0.45, 0.25) * 0.8);
  });
});
