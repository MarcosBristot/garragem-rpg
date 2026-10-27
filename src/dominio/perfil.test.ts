import { describe, expect, it } from "vitest";
import { validarPerfil } from "./perfil";

const base = { nomeUsuario: "piloto_01", nomeExibicao: "", cidade: "" };

describe("validarPerfil", () => {
  it("normaliza: minúsculas, sem espaços, vazio vira null", () => {
    expect(
      validarPerfil({
        nomeUsuario: "  Piloto_01 ",
        nomeExibicao: " Piloto ",
        cidade: "",
      }),
    ).toEqual({
      ok: true,
      dados: { nomeUsuario: "piloto_01", nomeExibicao: "Piloto", cidade: null },
    });
  });

  it.each(["ab", "a".repeat(31), "com espaço", "acentuação", "ponto.final"])(
    "recusa nome de usuário %j",
    (nomeUsuario) => {
      const r = validarPerfil({ ...base, nomeUsuario });
      expect(r.ok).toBe(false);
      expect(!r.ok && r.erros.nomeUsuario).toBeTruthy();
    },
  );

  it("aceita os limites do banco", () => {
    expect(
      validarPerfil({
        nomeUsuario: "a".repeat(30),
        nomeExibicao: "x".repeat(60),
        cidade: "y".repeat(80),
      }).ok,
    ).toBe(true);
  });

  it("recusa textos acima do limite", () => {
    const r = validarPerfil({
      ...base,
      nomeExibicao: "x".repeat(61),
      cidade: "y".repeat(81),
    });
    expect(r).toEqual({
      ok: false,
      erros: {
        nomeExibicao: "Máximo de 60 caracteres.",
        cidade: "Máximo de 80 caracteres.",
      },
    });
  });

  it("aceita campo ausente (null do FormData)", () => {
    expect(
      validarPerfil({ nomeUsuario: "piloto", nomeExibicao: null, cidade: null })
        .ok,
    ).toBe(true);
  });
});
