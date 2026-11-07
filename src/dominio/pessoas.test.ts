import { describe, expect, it } from "vitest";
import { MAX_BUSCA, termoBusca } from "./pessoas";

describe("termoBusca", () => {
  it("aceita nome, @usuário e acentos", () => {
    expect(termoBusca("  João  Silva ")).toBe("João Silva");
    expect(termoBusca("@piloto_teste")).toBe("piloto_teste");
    expect(termoBusca("ana-maria")).toBe("ana-maria");
  });

  it("tira o que mudaria o filtro do banco", () => {
    expect(termoBusca("ana,id.eq.1")).toBe("anaideq1");
    expect(termoBusca("50%")).toBe("50");
    expect(termoBusca("x)(y")).toBe("xy");
  });

  it("termo curto demais, vazio ou de outro tipo não busca", () => {
    expect(termoBusca("a")).toBeNull();
    expect(termoBusca("  @ ")).toBeNull();
    expect(termoBusca(["ana"])).toBeNull();
    expect(termoBusca(undefined)).toBeNull();
  });

  it("corta textos longos", () => {
    expect(termoBusca("a".repeat(100))?.length).toBe(MAX_BUSCA);
  });
});
