import { describe, expect, it } from "vitest";
import {
  centavosParaCampo,
  formatarReais,
  reaisParaCentavos,
} from "./dinheiro";

describe("reaisParaCentavos", () => {
  it.each([
    ["180", 18000],
    ["180,5", 18050],
    ["180,05", 18005],
    ["1.234,56", 123456],
    ["R$ 1.234,56", 123456],
    ["0,99", 99],
    ["9.999.999,99", 999999999],
  ])("%j → %d centavos", (texto, centavos) => {
    expect(reaisParaCentavos(texto)).toBe(centavos);
  });

  it("vazio vira null (valor não informado)", () => {
    expect(reaisParaCentavos("  ")).toBeNull();
  });

  it.each(["-10", "10,999", "abc", "10.5.3,2,1", "10000000", "1e5"])(
    "recusa %j",
    (texto) => {
      expect(reaisParaCentavos(texto)).toBeUndefined();
    },
  );
});

describe("centavosParaCampo", () => {
  it("volta ao formato do campo", () => {
    expect(centavosParaCampo(123456)).toBe("1234,56");
    expect(centavosParaCampo(5)).toBe("0,05");
  });
});

describe("formatarReais", () => {
  it("usa o formato brasileiro", () => {
    // Intl usa espaço não separável depois de "R$".
    expect(formatarReais(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
});
