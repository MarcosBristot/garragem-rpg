import { describe, expect, it } from "vitest";
import { validarCarro } from "./carro";

const ANO_ATUAL = 2026;
const base = {
  marca: "Marca",
  modelo: "Modelo",
  ano: "",
  apelido: "",
  publico: null,
};

describe("validarCarro", () => {
  it("normaliza: espaços, ano vazio vira null, privado por padrão", () => {
    expect(
      validarCarro({ ...base, marca: "  Marca ", apelido: "   " }, ANO_ATUAL),
    ).toEqual({
      ok: true,
      dados: {
        marca: "Marca",
        modelo: "Modelo",
        ano: null,
        apelido: null,
        publico: false,
      },
    });
  });

  it('checkbox marcado ("on") torna o carro público', () => {
    const r = validarCarro({ ...base, publico: "on" }, ANO_ATUAL);
    expect(r.ok && r.dados.publico).toBe(true);
  });

  it("converte o ano para número", () => {
    const r = validarCarro({ ...base, ano: " 1998 " }, ANO_ATUAL);
    expect(r.ok && r.dados.ano).toBe(1998);
  });

  it.each(["1885", "2028", "19.5", "abc"])("recusa ano %j", (ano) => {
    const r = validarCarro({ ...base, ano }, ANO_ATUAL);
    expect(r).toEqual({
      ok: false,
      erros: { ano: "Use um ano entre 1886 e 2027." },
    });
  });

  it("aceita os limites: 1886 e o modelo do ano que vem", () => {
    expect(validarCarro({ ...base, ano: "1886" }, ANO_ATUAL).ok).toBe(true);
    expect(validarCarro({ ...base, ano: "2027" }, ANO_ATUAL).ok).toBe(true);
  });

  it("exige marca e modelo e respeita os tamanhos do banco", () => {
    const r = validarCarro(
      { ...base, marca: "", modelo: "m".repeat(61), apelido: "a".repeat(41) },
      ANO_ATUAL,
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "apelido",
      "marca",
      "modelo",
    ]);
  });

  it("aceita textos no limite", () => {
    expect(
      validarCarro(
        {
          ...base,
          marca: "m".repeat(40),
          modelo: "m".repeat(60),
          apelido: "a".repeat(40),
        },
        ANO_ATUAL,
      ).ok,
    ).toBe(true);
  });
});
