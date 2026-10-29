import { describe, expect, it } from "vitest";
import { validarRegistro } from "./registro";

const HOJE = "2026-10-28";
const base = {
  tipo: "manutencao",
  titulo: "Troca de óleo",
  data: "2026-10-01",
  km: "",
  notas: "",
  visibilidade: "",
};

describe("validarRegistro", () => {
  it("normaliza e usa privado como visibilidade padrão", () => {
    expect(
      validarRegistro({ ...base, titulo: " Troca de óleo " }, HOJE),
    ).toEqual({
      ok: true,
      dados: {
        tipo: "manutencao",
        titulo: "Troca de óleo",
        data: "2026-10-01",
        km: null,
        notas: null,
        visibilidade: "privado",
      },
    });
  });

  it("aceita km com ponto de milhar", () => {
    const r = validarRegistro({ ...base, km: "120.500" }, HOJE);
    expect(r.ok && r.dados.km).toBe(120500);
  });

  it.each(["-1", "12,5", "abc", "10000000"])("recusa km %j", (km) => {
    const r = validarRegistro({ ...base, km }, HOJE);
    expect(!r.ok && r.erros.km).toBeTruthy();
  });

  it("aceita data de hoje e recusa data futura", () => {
    expect(validarRegistro({ ...base, data: HOJE }, HOJE).ok).toBe(true);
    expect(validarRegistro({ ...base, data: "2026-10-29" }, HOJE)).toEqual({
      ok: false,
      erros: { data: "A data não pode estar no futuro." },
    });
  });

  it.each(["", "2026-02-30", "28/10/2026", "2026-13-01"])(
    "recusa data inválida %j",
    (data) => {
      expect(validarRegistro({ ...base, data }, HOJE)).toEqual({
        ok: false,
        erros: { data: "Informe uma data válida." },
      });
    },
  );

  it("recusa tipo e visibilidade fora da lista (form adulterado)", () => {
    const r = validarRegistro(
      { ...base, tipo: "corrida", visibilidade: "secreto" },
      HOJE,
    );
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "tipo",
      "visibilidade",
    ]);
  });

  it("aceita as três visibilidades", () => {
    for (const visibilidade of ["privado", "publico_sem_valor", "publico"]) {
      expect(validarRegistro({ ...base, visibilidade }, HOJE).ok).toBe(true);
    }
  });

  it("respeita os tamanhos do banco", () => {
    expect(
      validarRegistro(
        { ...base, titulo: "t".repeat(120), notas: "n".repeat(5000) },
        HOJE,
      ).ok,
    ).toBe(true);
    const r = validarRegistro(
      { ...base, titulo: "t".repeat(121), notas: "n".repeat(5001) },
      HOJE,
    );
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual(["notas", "titulo"]);
  });

  it("não aceita propriedades herdadas como tipo válido", () => {
    // "toString" existe em todo objeto JS: `in` sozinho deixaria passar.
    const r = validarRegistro({ ...base, tipo: "toString" }, HOJE);
    expect(r.ok).toBe(false);
  });
});
