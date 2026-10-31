import { describe, expect, it } from "vitest";
import { validarOS } from "./ordem-servico";

const HOJE = "2026-10-31";
const vazio = { oficina: "", data: "", km: "", total: "" };

describe("validarOS", () => {
  it("tudo vazio é válido (só a foto anexada)", () => {
    expect(validarOS(vazio, HOJE)).toEqual({
      ok: true,
      dados: { oficina: null, data: null, km: null, totalCentavos: null },
    });
  });

  it("converte km com ponto de milhar e total em reais", () => {
    const r = validarOS(
      {
        oficina: " Oficina Fictícia ",
        data: "2026-10-20",
        km: "120.500",
        total: "R$ 1.234,56",
      },
      HOJE,
    );
    expect(r).toEqual({
      ok: true,
      dados: {
        oficina: "Oficina Fictícia",
        data: "2026-10-20",
        km: 120500,
        totalCentavos: 123456,
      },
    });
  });

  it("recusa data futura, data inválida, km e total mal formatados", () => {
    expect(validarOS({ ...vazio, data: "2026-11-01" }, HOJE)).toEqual({
      ok: false,
      erros: { data: "A data não pode estar no futuro." },
    });
    const r = validarOS(
      {
        oficina: "x".repeat(121),
        data: "2026-02-30",
        km: "12,5",
        total: "10,999",
      },
      HOJE,
    );
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "data",
      "km",
      "oficina",
      "totalCentavos",
    ]);
  });
});
