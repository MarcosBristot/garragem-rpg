import { describe, expect, it } from "vitest";
import { limparDescricao, MAX_LEGENDA, validarPost } from "./post";

const CARRO = "c0000000-0000-0000-0000-000000000001";

describe("validarPost", () => {
  it("aceita carro e legenda, tirando espaços das pontas", () => {
    expect(validarPost({ carroId: CARRO, legenda: "  Lavado!  " })).toEqual({
      ok: true,
      dados: { carroId: CARRO, legenda: "Lavado!" },
    });
  });

  it("legenda é opcional (vazia vira null)", () => {
    expect(validarPost({ carroId: CARRO, legenda: "   " })).toMatchObject({
      ok: true,
      dados: { legenda: null },
    });
  });

  it("exige um carro válido", () => {
    for (const carroId of ["", "abc", null, "../x"]) {
      expect(validarPost({ carroId, legenda: "" })).toMatchObject({
        ok: false,
        erros: { carro: expect.any(String) },
      });
    }
  });

  it("limita o tamanho da legenda", () => {
    const longa = "a".repeat(MAX_LEGENDA + 1);
    expect(validarPost({ carroId: CARRO, legenda: longa })).toMatchObject({
      ok: false,
      erros: { legenda: expect.any(String) },
    });
  });
});

describe("limparDescricao", () => {
  it("corta no limite e trata vazio como ausente", () => {
    expect(limparDescricao("  Traseira  ")).toBe("Traseira");
    expect(limparDescricao("")).toBeNull();
    expect(limparDescricao(null)).toBeNull();
    expect(limparDescricao("x".repeat(500))).toHaveLength(200);
  });
});
