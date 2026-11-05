import { describe, expect, it } from "vitest";
import {
  ARCO_RAIO,
  COMPRIMENTO,
  curva,
  EIXO_DIANTEIRO,
  pontoCarroceria,
  RODA_RAIO,
  uDoX,
  vNaAltura,
  xDianteiroEm,
  xTraseiroEm,
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

  it("tem medidas de um cupê GT (4,9 m × 1,9 m × 1,38 m)", () => {
    expect(max(0) - min(0)).toBeCloseTo(COMPRIMENTO, 1);
    expect(max(2) - min(2)).toBeGreaterThan(1.85);
    expect(max(2) - min(2)).toBeLessThan(2.0);
    expect(max(1)).toBeGreaterThan(1.34);
    expect(max(1)).toBeLessThan(1.42);
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

  it("no arco a lateral recolhe para trás do pneu: a roda fica à mostra", () => {
    const u = (EIXO_DIANTEIRO + COMPRIMENTO / 2) / COMPRIMENTO;
    // Face interna do pneu: centro em z = 0,8, largura 0,27 (no Blender
    // o pneu é posto no mesmo lugar).
    const faceInterna = 0.8 - 0.135;
    for (const v of [0.2, 0.22, 0.25]) {
      const [, y, z] = pontoCarroceria(u, v);
      if (y < RODA_RAIO + ARCO_RAIO - 0.06) {
        expect(Math.abs(z)).toBeLessThan(faceInterna);
      }
    }
    // Fora do arco a lateral continua cheia.
    const [, , zFora] = pontoCarroceria(0.5, 0.25);
    expect(Math.abs(zFora)).toBeGreaterThan(0.85);
  });

  it("nenhuma dobra: a altura sobe sempre em volta da seção", () => {
    for (const u of [0.1, 0.2, 0.8, 0.9]) {
      let anterior = -Infinity;
      for (let v = 0; v <= 0.5; v += 0.01) {
        const [, y] = pontoCarroceria(u, v);
        expect(y).toBeGreaterThanOrEqual(anterior - 1e-9);
        anterior = y;
      }
    }
  });

  it("a lanterna pousa na traseira e acompanha a curva", () => {
    const centro = xTraseiroEm(0.78, 0);
    const canto = xTraseiroEm(0.78, 0.78);
    expect(centro).toBeLessThan(-2.3);
    expect(canto).toBeGreaterThan(centro); // os cantos ficam mais à frente
    // O ponto achado está mesmo na lataria (dentro da seção).
    expect(canto).toBeLessThan(-2.0);
  });

  it("os faróis pousam na frente, recuando nos cantos", () => {
    const centro = xDianteiroEm(0.66, 0);
    const canto = xDianteiroEm(0.66, 0.62);
    expect(centro).toBeGreaterThan(2.3);
    expect(canto).toBeLessThan(centro);
  });

  it("acha v pela altura (para recortar as janelas)", () => {
    for (const u of [0.3, 0.5, 0.9]) {
      for (const y of [0.3, 0.6, 0.85]) {
        expect(pontoCarroceria(u, vNaAltura(u, y))[1]).toBeCloseTo(y, 4);
      }
    }
    expect(uDoX(0)).toBeCloseTo(0.5);
  });

  it("o teto é mais estreito que a lataria (cintura do teto)", () => {
    const larguraEm = (u: number, v: number) =>
      Math.abs(pontoCarroceria(u, v)[2]);
    expect(larguraEm(0.45, 0.42)).toBeLessThan(larguraEm(0.45, 0.25) * 0.8);
  });
});
