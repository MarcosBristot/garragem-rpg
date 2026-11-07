import { describe, expect, it } from "vitest";
import {
  caminhoQuadro,
  cobrir,
  misturaDaRolagem,
  ordemDeCarga,
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

describe("ordemDeCarga", () => {
  it("baixa primeiro 1 a cada 8, depois preenche, sem repetir nenhum", () => {
    const ordem = ordemDeCarga(48, 1);
    expect(ordem.slice(0, 7)).toEqual([0, 8, 16, 24, 32, 40, 47]);
    expect(new Set(ordem).size).toBe(48);
    expect([...ordem].sort((x, y) => x - y)).toEqual(
      Array.from({ length: 48 }, (_, i) => i),
    );
  });

  it("respeita o passo do celular (só os quadros que ele baixa)", () => {
    const ordem = ordemDeCarga(48, 2);
    expect(ordem).toHaveLength(25);
    expect(ordem.every((q) => q % 2 === 0 || q === 47)).toBe(true);
  });
});

describe("misturaDaRolagem", () => {
  const todos = () => true;

  it("entre dois quadros, mistura na proporção da rolagem", () => {
    // 47 intervalos; progresso no meio do intervalo 10→11.
    const r = misturaDaRolagem(10.5 / 47, 48, todos)!;
    expect(r.a).toBe(10);
    expect(r.b).toBe(11);
    expect(r.mistura).toBeCloseTo(0.5);
  });

  it("em cima de um quadro, não mistura", () => {
    expect(misturaDaRolagem(0, 48, todos)).toEqual({ a: 0, b: 0, mistura: 0 });
    expect(misturaDaRolagem(1, 48, todos)).toEqual({
      a: 47,
      b: 47,
      mistura: 0,
    });
  });

  it("com quadros faltando, mistura os carregados mais próximos", () => {
    const so = (l: number[]) => (i: number) => l.includes(i);
    const r = misturaDaRolagem(12 / 47, 48, so([8, 16]))!;
    expect([r.a, r.b]).toEqual([8, 16]);
    expect(r.mistura).toBeCloseTo(0.5);
    expect(misturaDaRolagem(0.5, 48, so([]))).toBeNull();
    expect(misturaDaRolagem(0.9, 48, so([0]))).toEqual({
      a: 0,
      b: 0,
      mistura: 0,
    });
  });
});
