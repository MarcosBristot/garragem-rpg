import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { nivelDoXp, progressoXp, REGRAS_XP, xpParaNivel } from "./xp";

describe("xpParaNivel", () => {
  it("segue a curva combinada", () => {
    expect([1, 2, 3, 4, 5].map(xpParaNivel)).toEqual([0, 100, 250, 450, 700]);
  });

  it("cada nível pede mais XP que o anterior", () => {
    for (let n = 2; n < 50; n++) {
      expect(xpParaNivel(n + 1) - xpParaNivel(n)).toBeGreaterThan(
        xpParaNivel(n) - xpParaNivel(n - 1),
      );
    }
  });
});

describe("nivelDoXp", () => {
  it("começa no nível 1, inclusive com XP inválido", () => {
    expect(nivelDoXp(0)).toBe(1);
    expect(nivelDoXp(-10)).toBe(1);
    expect(nivelDoXp(Number.NaN)).toBe(1);
  });

  it("sobe exatamente no limite do nível", () => {
    expect(nivelDoXp(99)).toBe(1);
    expect(nivelDoXp(100)).toBe(2);
    expect(nivelDoXp(249)).toBe(2);
    expect(nivelDoXp(250)).toBe(3);
  });

  it("é a inversa da curva em todos os níveis", () => {
    for (let n = 1; n < 200; n++) {
      expect(nivelDoXp(xpParaNivel(n))).toBe(n);
      expect(nivelDoXp(xpParaNivel(n + 1) - 1)).toBe(n);
    }
  });
});

describe("progressoXp", () => {
  it("mostra quanto falta dentro do nível", () => {
    expect(progressoXp(175)).toEqual({
      xp: 175,
      nivel: 2,
      noNivel: 75,
      doNivel: 150,
      porcento: 50,
    });
  });

  it("carro novo começa zerado no nível 1", () => {
    expect(progressoXp(0)).toMatchObject({
      nivel: 1,
      porcento: 0,
      doNivel: 100,
    });
  });
});

describe("REGRAS_XP", () => {
  // A fonte da verdade é o banco; isto evita a tela mostrar outros números.
  it("tem os mesmos pontos e limites de private.regra_xp()", () => {
    const pasta = join(process.cwd(), "supabase", "migrations");
    const arquivo = readdirSync(pasta).find((a) =>
      a.endsWith("_eventos_xp.sql"),
    );
    const sql = readFileSync(join(pasta, arquivo!), "utf8");
    const [, pontos, limites] =
      /select case p_acao([\s\S]*?)end,\s*case p_acao([\s\S]*?)end;/.exec(sql)!;
    const ler = (trecho: string) =>
      Object.fromEntries(
        [...trecho.matchAll(/when '(\w+)' then (\d+)/g)].map(([, a, n]) => [
          a,
          Number(n),
        ]),
      );
    const esperado = (campo: "pontos" | "limiteDia") =>
      Object.fromEntries(
        Object.entries(REGRAS_XP).map(([a, r]) => [a, r[campo]]),
      );
    expect(ler(pontos)).toEqual(esperado("pontos"));
    expect(ler(limites)).toEqual(esperado("limiteDia"));
  });

  it("dinheiro não aparece em nenhuma regra", () => {
    for (const regra of Object.values(REGRAS_XP)) {
      expect(Object.keys(regra)).not.toContain("valor");
    }
  });
});
