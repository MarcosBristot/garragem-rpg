import { describe, expect, it } from "vitest";
import { validarDenuncia } from "./denuncia";

const ID = "c0000000-0000-0000-0000-000000000001";
const base = {
  alvoTipo: "carro",
  alvoId: ID,
  motivo: "ofensivo",
  detalhes: "",
};

describe("validarDenuncia", () => {
  it("aceita denúncia válida sem detalhes", () => {
    expect(validarDenuncia(base)).toEqual({
      ok: true,
      dados: {
        alvoTipo: "carro",
        alvoId: ID,
        motivo: "ofensivo",
        detalhes: null,
      },
    });
  });

  it.each([
    { alvoTipo: "post", alvoId: ID },
    { alvoTipo: "carro", alvoId: "../x" },
    { alvoTipo: "toString", alvoId: ID },
  ])("recusa alvo inválido %j", (alvo) => {
    const r = validarDenuncia({ ...base, ...alvo });
    expect(!r.ok && r.erros.alvo).toBeTruthy();
  });

  it("recusa motivo fora da lista, inclusive herdado", () => {
    expect(validarDenuncia({ ...base, motivo: "constructor" }).ok).toBe(false);
  });

  it('"outro" exige detalhes', () => {
    const r = validarDenuncia({ ...base, motivo: "outro" });
    expect(!r.ok && r.erros.detalhes).toBe("Conte o que aconteceu.");
    expect(
      validarDenuncia({ ...base, motivo: "outro", detalhes: "Explicação" }).ok,
    ).toBe(true);
  });

  it("limita os detalhes a 1.000 caracteres", () => {
    expect(validarDenuncia({ ...base, detalhes: "x".repeat(1000) }).ok).toBe(
      true,
    );
    expect(validarDenuncia({ ...base, detalhes: "x".repeat(1001) }).ok).toBe(
      false,
    );
  });
});
