import { describe, expect, it } from "vitest";
import {
  calcularAtributos,
  curva,
  lerInsumos,
  type Insumos,
} from "./atributos";

const HOJE = "2026-11-02";
const vazio: Insumos = {
  potencia_cv: null,
  mods_motor: 0,
  curtidores: 0,
  diy_com_prova: 0,
  reaproveitadas: 0,
  meses_ativos_12m: 0,
  registros_12m: 0,
  completos_12m: 0,
  xp: 0,
  ultima_manutencao: null,
  km_ultima_manutencao: null,
  km_atual: null,
};
const calc = (parcial: Partial<Insumos>) =>
  calcularAtributos({ ...vazio, ...parcial }, HOJE);

describe("curva", () => {
  it("bate com os exemplos combinados", () => {
    expect([5, 25, 50, 100].map((n) => curva(n, 25))).toEqual([18, 63, 86, 98]);
  });

  it("nunca passa de 100 nem fica negativa", () => {
    expect(curva(1_000_000, 25)).toBe(100);
    expect(curva(-5, 25)).toBe(0);
    expect(curva(Number.NaN, 25)).toBe(0);
  });
});

describe("calcularAtributos", () => {
  it("carro novo começa zerado, sem Condição inventada", () => {
    expect(calc({})).toEqual({
      potencia: 0,
      estilo: 0,
      engenhosidade: 0,
      dedicacao: 0,
      condicao: null,
    });
  });

  it("Potência: cv de fábrica até 60 + 10 por mod de motor até 40", () => {
    expect(calc({ potencia_cv: 120 }).potencia).toBe(30);
    expect(calc({ potencia_cv: 1000 }).potencia).toBe(60);
    expect(calc({ potencia_cv: 120, mods_motor: 2 }).potencia).toBe(50);
    expect(calc({ potencia_cv: 1000, mods_motor: 50 }).potencia).toBe(100);
  });

  it("Estilo vem de pessoas diferentes que curtiram", () => {
    expect(calc({ curtidores: 25 }).estilo).toBe(63);
  });

  it("Engenhosidade: 'fiz eu mesmo' vale o dobro de peça reaproveitada", () => {
    expect(calc({ diy_com_prova: 5 }).engenhosidade).toBe(39);
    expect(calc({ reaproveitadas: 10 }).engenhosidade).toBe(39);
    expect(calc({ diy_com_prova: 10 }).engenhosidade).toBe(63);
  });

  it("Dedicação: 5 por mês ativo (até 12) + até 40 pela proporção de completos", () => {
    expect(
      calc({ meses_ativos_12m: 12, registros_12m: 20, completos_12m: 20 })
        .dedicacao,
    ).toBe(100);
    expect(
      calc({ meses_ativos_12m: 4, registros_12m: 4, completos_12m: 2 })
        .dedicacao,
    ).toBe(40);
    // Dados estranhos não estouram a escala.
    expect(
      calc({ meses_ativos_12m: 40, registros_12m: 1, completos_12m: 9 })
        .dedicacao,
    ).toBe(100);
  });

  it("Condição usa a mesma regra do painel (vence em 1 ano = 50)", () => {
    expect(calc({ ultima_manutencao: HOJE }).condicao).toBe(100);
    expect(calc({ ultima_manutencao: "2025-11-02" }).condicao).toBe(50);
    expect(
      calc({
        ultima_manutencao: HOJE,
        km_ultima_manutencao: 50_000,
        km_atual: 60_000,
      }).condicao,
    ).toBe(50);
  });

  it("todos ficam entre 0 e 100 mesmo com números absurdos", () => {
    const a = calc({
      potencia_cv: 99999,
      mods_motor: 999,
      curtidores: 99999,
      diy_com_prova: 999,
      reaproveitadas: 999,
      meses_ativos_12m: 999,
      registros_12m: 999,
      completos_12m: 999,
    });
    for (const v of [a.potencia, a.estilo, a.engenhosidade, a.dedicacao]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("lerInsumos", () => {
  it("lê o JSON do banco e tolera campos faltando ou estranhos", () => {
    expect(lerInsumos(null)).toBeNull();
    expect(lerInsumos([])).toBeNull();
    expect(
      lerInsumos({ curtidores: 3, xp: "muito", ultima_manutencao: "ontem" }),
    ).toEqual({ ...vazio, curtidores: 3 });
  });
});
