import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { comAlfa, contraste, PALETA } from "./paleta";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const token = (nome: string) =>
  new RegExp(`--color-${nome}:\\s*(#[0-9a-f]{6})`, "i").exec(css)?.[1];

describe("paleta", () => {
  it("bate com os tokens do Tailwind (globals.css)", () => {
    expect(token("fundo")).toBe(PALETA.fundo);
    expect(token("superficie")).toBe(PALETA.superficie);
    expect(token("superficie-2")).toBe(PALETA.superficie2);
    expect(token("borda")).toBe(PALETA.borda);
    expect(token("borda-campo")).toBe(PALETA.bordaCampo);
    expect(token("texto")).toBe(PALETA.texto);
    expect(token("texto-secundario")).toBe(PALETA.textoSecundario);
    expect(token("texto-apagado")).toBe(PALETA.textoApagado);
    expect(token("destaque")).toBe(PALETA.destaque);
    expect(token("condicao")).toBe(PALETA.condicao);
  });

  // Regra do CLAUDE.md: texto 4.5:1; contorno de campo 3:1.
  const fundos = [PALETA.fundo, PALETA.superficie, PALETA.superficie2];

  it.each([
    ["texto", PALETA.texto],
    ["texto secundário", PALETA.textoSecundario],
    ["texto apagado", PALETA.textoApagado],
    ["destaque (links)", PALETA.destaque],
    ["condição", PALETA.condicao],
  ])("%s tem contraste 4.5:1 sobre todos os fundos", (_nome, cor) => {
    for (const fundo of fundos) {
      expect(contraste(cor, fundo)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("borda de campo tem 3:1 sobre todos os fundos", () => {
    for (const fundo of fundos) {
      expect(contraste(PALETA.bordaCampo, fundo)).toBeGreaterThanOrEqual(3);
    }
  });

  it("texto escuro sobre botão de destaque tem 4.5:1", () => {
    expect(contraste(PALETA.fundo, PALETA.destaque)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("comAlfa converte hex em rgba", () => {
    expect(comAlfa("#ff5a4a", 0.3)).toBe("rgba(255, 90, 74, 0.3)");
  });

  it("contraste: preto e branco = 21", () => {
    expect(contraste("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });
});
