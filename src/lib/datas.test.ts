import { describe, expect, it } from "vitest";
import { formatarData, hojeEmSaoPaulo, tempoDesde } from "./datas";

describe("hojeEmSaoPaulo", () => {
  it("às 23h em São Paulo ainda é o mesmo dia, mesmo já sendo amanhã em UTC", () => {
    // 28/10 02:00 UTC = 27/10 23:00 em São Paulo (UTC-3).
    expect(hojeEmSaoPaulo(new Date("2026-10-28T02:00:00Z"))).toBe("2026-10-27");
  });

  it("de manhã coincide com UTC", () => {
    expect(hojeEmSaoPaulo(new Date("2026-10-28T12:00:00Z"))).toBe("2026-10-28");
  });
});

describe("formatarData", () => {
  it("formata no padrão brasileiro sem mudar o dia", () => {
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
  });
});

describe("tempoDesde", () => {
  const agora = new Date("2026-11-02T15:00:00Z");
  it.each([
    ["2026-11-02T14:59:30Z", "agora"],
    ["2026-11-02T14:55:00Z", "há 5 min"],
    ["2026-11-02T12:00:00Z", "há 3 h"],
    ["2026-11-01T14:00:00Z", "há 1 dia"],
    ["2026-10-29T15:00:00Z", "há 4 dias"],
  ])("%s → %s", (instante, esperado) => {
    expect(tempoDesde(instante, agora)).toBe(esperado);
  });

  it("depois de uma semana mostra a data de São Paulo", () => {
    // 20/10 01:00 UTC = 19/10 22:00 em São Paulo.
    expect(tempoDesde("2026-10-20T01:00:00Z", agora)).toBe("19/10/2026");
  });

  it("relógio adiantado no servidor não gera tempo negativo", () => {
    expect(tempoDesde("2026-11-02T15:00:10Z", agora)).toBe("agora");
  });
});
