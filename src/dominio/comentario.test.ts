import { describe, expect, it } from "vitest";
import { MAX_COMENTARIO, validarComentario } from "./comentario";

describe("validarComentario", () => {
  it("aceita texto e tira espaços das pontas", () => {
    expect(validarComentario("  Ficou top!  ")).toEqual({
      ok: true,
      texto: "Ficou top!",
    });
  });

  it("recusa vazio ou só espaços", () => {
    for (const v of ["", "   ", "\n\n", null, undefined]) {
      expect(validarComentario(v).ok).toBe(false);
    }
  });

  it("junta linhas em branco repetidas", () => {
    expect(validarComentario("a\r\n\r\n\r\n\r\nb")).toEqual({
      ok: true,
      texto: "a\n\nb",
    });
  });

  it("limita o tamanho", () => {
    expect(validarComentario("x".repeat(MAX_COMENTARIO)).ok).toBe(true);
    expect(validarComentario("x".repeat(MAX_COMENTARIO + 1)).ok).toBe(false);
  });
});
