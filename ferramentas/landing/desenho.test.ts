import { describe, expect, it } from "vitest";
import {
  criarVista,
  espelhar,
  faixaRelevo,
  ler,
  linha,
  paraBytes,
  paraPixel,
  poligono,
} from "./desenho";

// Vista de 1 m × 1 m a 100 px/m: cada pixel tem 1 cm.
const nova = () => criarVista([0, 1], [0, 1], 100);

describe("desenho em vistas", () => {
  it("converte metros em pixels com o topo da imagem no alto da vista", () => {
    const v = nova();
    expect(v.largura).toBe(100);
    expect(v.altura).toBe(100);
    expect(paraPixel(v, [0, 1])).toEqual([0, 0]);
    expect(paraPixel(v, [0.5, 0])).toEqual([50, 100]);
  });

  it("a linha cobre a largura pedida e nada além", () => {
    const v = nova();
    linha(
      v,
      [
        [0.1, 0.5],
        [0.9, 0.5],
      ],
      0.04,
      0,
    );
    expect(ler(v, 50, 50, 0)).toBe(1); // no meio da linha
    expect(ler(v, 50, 51, 0)).toBe(1); // 1 cm abaixo, ainda dentro (meia largura 2 cm)
    expect(ler(v, 50, 55, 0)).toBe(0); // 5 cm abaixo, fora
    expect(ler(v, 50, 50, 1)).toBe(0); // só no canal pedido
  });

  it("o polígono preenche por dentro e suaviza a borda", () => {
    const v = nova();
    poligono(
      v,
      [
        [0.2, 0.2],
        [0.8, 0.2],
        [0.8, 0.8],
        [0.2, 0.8],
      ],
      2,
    );
    expect(ler(v, 50, 50, 2)).toBe(1);
    expect(ler(v, 10, 10, 2)).toBe(0);
    expect(ler(v, 20, 50, 2)).toBeCloseTo(1, 1); // primeiro pixel dentro
    expect(ler(v, 19, 50, 2)).toBeLessThan(0.1); // primeiro pixel fora
  });

  it("o relevo sobe entre as curvas e some nas pontas", () => {
    const v = nova();
    faixaRelevo(
      v,
      [0.1, 0.9],
      () => 0.3,
      () => 0.6,
      0.02,
      0.1,
      3,
    );
    expect(ler(v, 50, 55, 3)).toBe(1); // v = 0,45: dentro da faixa
    expect(ler(v, 50, 20, 3)).toBe(0); // v = 0,8: acima
    expect(ler(v, 11, 55, 3)).toBeLessThan(0.1); // começo: ainda sumido
  });

  it("espelha para o outro lado e exporta em bytes", () => {
    expect(espelhar([[0.3, 0.5]])).toEqual([[-0.3, 0.5]]);
    const v = nova();
    linha(
      v,
      [
        [0, 0.5],
        [1, 0.5],
      ],
      0.1,
      0,
    );
    const b = paraBytes(v);
    expect(b[(50 * 100 + 50) * 4]).toBe(255);
    expect(b.length).toBe(100 * 100 * 4);
  });
});
