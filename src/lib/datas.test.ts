import { describe, expect, it } from "vitest";
import { formatarData, hojeEmSaoPaulo } from "./datas";

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
