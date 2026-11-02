import { describe, expect, it } from "vitest";
import type { Insumos } from "./atributos";
import { avaliarConquistas, CONQUISTAS } from "./conquistas";

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
  registros_total: 0,
  manutencoes_total: 0,
  completos_total: 0,
  primeiro_registro: null,
  ultimo_registro: null,
  posts_total: 0,
  espacos_ocupados: 0,
};
const avaliar = (parcial: Partial<Insumos>) =>
  Object.fromEntries(
    avaliarConquistas({ ...vazio, ...parcial }).map((c) => [c.id, c]),
  );

describe("avaliarConquistas", () => {
  it("carro novo: nenhuma desbloqueada, tudo em zero", () => {
    const todas = avaliarConquistas(vazio);
    expect(todas).toHaveLength(CONQUISTAS.length);
    expect(todas.every((c) => !c.desbloqueada)).toBe(true);
    // Todo carro começa no nível 1: o Veterano já mostra "1 de 5".
    expect(
      todas.filter((c) => c.atual > 0).map((c) => [c.id, c.atual]),
    ).toEqual([["veterano", 1]]);
  });

  it("ids únicos (viram chaves na tela)", () => {
    const ids = CONQUISTAS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("mostra o progresso e desbloqueia no alvo", () => {
    const c = avaliar({ registros_total: 7 });
    expect(c.diario_em_dia).toMatchObject({
      atual: 7,
      alvo: 10,
      desbloqueada: false,
    });
    expect(avaliar({ registros_total: 10 }).diario_em_dia.desbloqueada).toBe(
      true,
    );
  });

  it("progresso nunca passa do alvo", () => {
    expect(avaliar({ registros_total: 500 }).diario_em_dia.atual).toBe(10);
  });

  it("um ano de estrada conta os dias entre o primeiro e o último registro", () => {
    const quase = avaliar({
      primeiro_registro: "2025-11-03",
      ultimo_registro: "2026-11-02",
    });
    expect(quase.um_ano_de_estrada).toMatchObject({
      atual: 364,
      desbloqueada: false,
    });
    const ano = avaliar({
      primeiro_registro: "2025-11-02",
      ultimo_registro: "2026-11-02",
    });
    expect(ano.um_ano_de_estrada.desbloqueada).toBe(true);
  });

  it("veterano usa o nível do XP (nível 5 = 700 XP)", () => {
    expect(avaliar({ xp: 699 }).veterano).toMatchObject({
      atual: 4,
      desbloqueada: false,
    });
    expect(avaliar({ xp: 700 }).veterano.desbloqueada).toBe(true);
  });

  it("montado exige os 6 espaços", () => {
    expect(avaliar({ espacos_ocupados: 5 }).montado.desbloqueada).toBe(false);
    expect(avaliar({ espacos_ocupados: 6 }).montado.desbloqueada).toBe(true);
  });

  it("apagar os dados tira a conquista (derivada)", () => {
    expect(
      avaliar({ manutencoes_total: 1 }).primeira_revisao.desbloqueada,
    ).toBe(true);
    expect(
      avaliar({ manutencoes_total: 0 }).primeira_revisao.desbloqueada,
    ).toBe(false);
  });
});
