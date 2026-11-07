import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DURACOES,
  duracaoEmHoras,
  instanteDeSaoPaulo,
  jaComecou,
  jaTerminou,
  paraCampoDataHora,
  quandoEncontro,
  TIPOS_ENCONTRO,
  validarEncontro,
} from "./encontro";

const AGORA = new Date("2026-11-07T15:00:00Z"); // 12:00 em São Paulo
const base = {
  titulo: "Encontro de teste",
  tipo: "encontro",
  descricao: "",
  local_nome: "Praça Fictícia",
  cidade: "Cidade Fictícia",
  lat: "-23.550521",
  lng: "-46.633308",
  inicio: "2026-11-08T19:30",
  duracao: "4",
};

describe("validarEncontro", () => {
  it("monta datas no horário de São Paulo e arredonda o ponto", () => {
    const r = validarEncontro(base, AGORA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados.inicio).toBe("2026-11-08T22:30:00.000Z");
    expect(r.dados.fim).toBe("2026-11-09T02:30:00.000Z");
    expect(r.dados.lat).toBe(-23.55052);
    expect(r.dados.lng).toBe(-46.63331);
    expect(r.dados.descricao).toBeNull();
  });

  it("recusa passado, antecedência demais e falta do ponto", () => {
    const passado = validarEncontro(
      { ...base, inicio: "2026-11-07T11:00" },
      AGORA,
    );
    expect(!passado.ok && passado.erros.inicio).toMatch(/futuro/);
    const longe = validarEncontro(
      { ...base, inicio: "2027-07-01T10:00" },
      AGORA,
    );
    expect(!longe.ok && longe.erros.inicio).toMatch(/6 meses/);
    const semPonto = validarEncontro({ ...base, lat: "", lng: "" }, AGORA);
    expect(!semPonto.ok && semPonto.erros.ponto).toBeTruthy();
    const foraDoMundo = validarEncontro({ ...base, lat: "91" }, AGORA);
    expect(!foraDoMundo.ok && foraDoMundo.erros.ponto).toBeTruthy();
  });

  it("tipo e duração só da lista (Object.hasOwn)", () => {
    for (const tipo of ["festa", "toString", ""]) {
      const r = validarEncontro({ ...base, tipo }, AGORA);
      expect(!r.ok && r.erros.tipo).toBeTruthy();
    }
    const r = validarEncontro({ ...base, duracao: "100" }, AGORA);
    expect(!r.ok && r.erros.duracao).toBeTruthy();
  });

  it("textos com tamanho do banco", () => {
    const r = validarEncontro(
      { ...base, titulo: "ab", local_nome: "x", descricao: "a".repeat(1001) },
      AGORA,
    );
    expect(!r.ok && Object.keys(r.erros).sort()).toEqual([
      "descricao",
      "local",
      "titulo",
    ]);
  });

  it("mesmos tipos do CHECK e duração máxima de 72 h, como na migração", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20261107163811_encontros.sql",
      ),
      "utf8",
    );
    const lista = sql.match(/tipo in \(([^)]*)\)/)?.[1] ?? "";
    const doBanco = [...lista.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(doBanco.sort()).toEqual(Object.keys(TIPOS_ENCONTRO).sort());
    expect(Math.max(...Object.keys(DURACOES).map(Number))).toBe(72);
    expect(sql).toContain("interval '72 hours'");
  });
});

describe("datas do encontro", () => {
  it("ida e volta entre o campo do formulário e o instante", () => {
    const iso = instanteDeSaoPaulo("2026-11-08T19:30")!.toISOString();
    expect(paraCampoDataHora(iso)).toBe("2026-11-08T19:30");
    expect(instanteDeSaoPaulo("ontem")).toBeNull();
  });

  it("duração para o form de edição", () => {
    expect(duracaoEmHoras("2026-11-08T22:30:00Z", "2026-11-09T02:30:00Z")).toBe(
      "4",
    );
    expect(duracaoEmHoras("2026-11-08T22:30:00Z", "2026-11-09T03:30:00Z")).toBe(
      "4",
    );
  });

  it("mostra dia e hora em São Paulo", () => {
    expect(quandoEncontro("2026-11-08T22:30:00Z")).toMatch(/8 de nov.*19:30/);
  });
});

describe("andamento do encontro", () => {
  it("começou e terminou, pelo relógio informado", () => {
    const agora = new Date("2026-11-08T23:00:00Z");
    expect(jaComecou("2026-11-08T22:30:00Z", agora)).toBe(true);
    expect(jaTerminou("2026-11-09T02:30:00Z", agora)).toBe(false);
    expect(jaTerminou("2026-11-08T22:59:00Z", agora)).toBe(true);
  });
});
