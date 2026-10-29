import { describe, expect, it } from "vitest";
import { totalCentavos, validarItem } from "./item";

const base = {
  descricao: "Óleo 5W30",
  categoria: "fluido",
  quantidade: "",
  valor: "",
  espaco: "",
};

describe("validarItem", () => {
  it("quantidade vazia vira 1; valor e espaço são opcionais", () => {
    expect(validarItem(base)).toEqual({
      ok: true,
      dados: {
        descricao: "Óleo 5W30",
        categoria: "fluido",
        quantidade: 1,
        valorCentavos: null,
        espaco: null,
      },
    });
  });

  it("aceita quantidade decimal com vírgula e valor em reais", () => {
    const r = validarItem({
      ...base,
      quantidade: "4,5",
      valor: "R$ 180,00",
      espaco: "motor",
    });
    expect(r.ok && r.dados).toMatchObject({
      quantidade: 4.5,
      valorCentavos: 18000,
      espaco: "motor",
    });
  });

  it.each(["0", "-1", "abc", "1,234", "123456789"])(
    "recusa quantidade %j",
    (quantidade) => {
      const r = validarItem({ ...base, quantidade });
      expect(!r.ok && r.erros.quantidade).toBeTruthy();
    },
  );

  it("recusa categoria e espaço fora da lista, inclusive herdados", () => {
    const r = validarItem({
      ...base,
      categoria: "toString",
      espaco: "constructor",
    });
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "categoria",
      "espaco",
    ]);
  });

  it("exige descrição e recusa valor mal formatado", () => {
    const r = validarItem({ ...base, descricao: " ", valor: "10,999" });
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "descricao",
      "valorCentavos",
    ]);
  });
});

describe("totalCentavos", () => {
  it("soma só os valores informados", () => {
    expect(
      totalCentavos([
        { valor_centavos: 18000 },
        { valor_centavos: null },
        { valor_centavos: 5050 },
      ]),
    ).toBe(23050);
  });

  it("lista vazia dá zero", () => {
    expect(totalCentavos([])).toBe(0);
  });
});
