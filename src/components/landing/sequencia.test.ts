import { describe, expect, it } from "vitest";
import {
  caminhoQuadro,
  cobrir,
  quadroDaRolagem,
  quadrosParaBaixar,
} from "./sequencia";

describe("caminhoQuadro", () => {
  it("usa três dígitos, como os arquivos renderizados", () => {
    expect(caminhoQuadro("desktop", 7)).toBe(
      "/landing/campo/desktop/quadro_007.webp",
    );
    expect(caminhoQuadro("mobile", 47)).toBe(
      "/landing/campo/mobile/quadro_047.webp",
    );
  });
});

describe("quadrosParaBaixar", () => {
  it("baixa todos com passo 1", () => {
    expect(quadrosParaBaixar(5, 1)).toEqual([0, 1, 2, 3, 4]);
  });

  it("pula quadros com passo maior, mas sempre inclui o último", () => {
    expect(quadrosParaBaixar(48, 2)).toHaveLength(25);
    expect(quadrosParaBaixar(48, 2).at(-1)).toBe(47);
    expect(quadrosParaBaixar(7, 3)).toEqual([0, 3, 6]);
  });

  it("passo inválido vira 1", () => {
    expect(quadrosParaBaixar(3, 0)).toEqual([0, 1, 2]);
  });
});

describe("quadroDaRolagem", () => {
  const todos = () => true;

  it("vai do primeiro ao último conforme a rolagem", () => {
    expect(quadroDaRolagem(0, 48, todos)).toBe(0);
    expect(quadroDaRolagem(0.5, 48, todos)).toBe(24);
    expect(quadroDaRolagem(1, 48, todos)).toBe(47);
  });

  it("trava fora de 0–1 e trata valores inválidos", () => {
    expect(quadroDaRolagem(-2, 48, todos)).toBe(0);
    expect(quadroDaRolagem(3, 48, todos)).toBe(47);
    expect(quadroDaRolagem(Number.NaN, 48, todos)).toBe(0);
  });

  it("usa o quadro carregado mais próximo enquanto o ideal não chega", () => {
    const so = (lista: number[]) => (i: number) => lista.includes(i);
    expect(quadroDaRolagem(0.5, 48, so([0, 20, 47]))).toBe(20);
    expect(quadroDaRolagem(0.5, 48, so([0, 30, 47]))).toBe(30);
    expect(quadroDaRolagem(0.5, 48, so([]))).toBe(-1);
  });
});

describe("cobrir", () => {
  it("cobre uma tela mais larga cortando em cima e embaixo", () => {
    expect(cobrir(1280, 720, 1920, 720)).toEqual({
      x: 0,
      y: -180,
      l: 1920,
      a: 1080,
    });
  });

  it("cobre uma tela mais alta cortando nas laterais", () => {
    const r = cobrir(1280, 720, 720, 1280);
    expect(r.a).toBeCloseTo(1280);
    expect(r.x).toBeLessThan(0);
    expect(r.y).toBeCloseTo(0);
  });

  it("o foco vertical decide o que é cortado", () => {
    expect(cobrir(1280, 720, 1920, 720, 0).y).toBe(0);
    expect(cobrir(1280, 720, 1920, 720, 1).y).toBe(-360);
  });
});
