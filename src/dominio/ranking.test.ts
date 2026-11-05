import { describe, expect, it } from "vitest";
import { lerFiltros, rotuloPosicao } from "./ranking";

describe("filtros do ranking", () => {
  it("lê classe e região válidas", () => {
    expect(lerFiltros({ classe: "suv", onde: "brasil" }, "hatch")).toEqual({
      classe: "suv",
      onde: "brasil",
    });
  });

  it("valor inválido cai no padrão (classe do seu carro, sua cidade)", () => {
    expect(lerFiltros({ classe: "toString", onde: "lua" }, "seda")).toEqual({
      classe: "seda",
      onde: "cidade",
    });
    expect(lerFiltros({}, "hatch")).toEqual({
      classe: "hatch",
      onde: "cidade",
    });
    expect(lerFiltros({ classe: ["suv"] }, "hatch").classe).toBe("hatch");
  });

  it("mostra a posição como ordinal", () => {
    expect(rotuloPosicao(1)).toBe("1º");
    expect(rotuloPosicao(12)).toBe("12º");
  });
});
