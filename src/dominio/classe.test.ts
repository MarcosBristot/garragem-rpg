import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLASSES, ehClasse, erroDaClasse } from "./classe";

describe("classe do carro (liga do ranking)", () => {
  it("aceita só as classes da lista (e não propriedades do objeto)", () => {
    for (const c of Object.keys(CLASSES)) expect(ehClasse(c)).toBe(true);
    for (const c of ["toString", "constructor", "", "Hatch", 1, null]) {
      expect(ehClasse(c)).toBe(false);
    }
  });

  it("mesma lista do CHECK de carros.classe na migração", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20261105012704_ranking.sql",
      ),
      "utf8",
    );
    const lista = sql.match(/classe in \(([^)]*)\)/)?.[1] ?? "";
    const doBanco = [...lista.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    expect(doBanco.sort()).toEqual(Object.keys(CLASSES).sort());
  });

  it("vazio é permitido: o carro só fica fora do ranking", () => {
    expect(erroDaClasse(null, null, 2026)).toBeNull();
  });

  it("clássico exige ano e 25 anos ou mais", () => {
    expect(erroDaClasse("classico", 2001, 2026)).toBeNull();
    expect(erroDaClasse("classico", 2002, 2026)).toMatch(/25 anos/);
    expect(erroDaClasse("classico", null, 2026)).toMatch(/informe o ano/);
    expect(erroDaClasse("hatch", null, 2026)).toBeNull();
  });
});
