import { describe, expect, it } from "vitest";
import { calcularCondicao, diasEntre } from "./condicao";

const HOJE = "2026-11-02";
const man = (data: string, km: number | null = null) => ({
  tipo: "manutencao" as const,
  data,
  km,
});
const mod = (data: string, km: number | null = null) => ({
  tipo: "modificacao" as const,
  data,
  km,
});

describe("diasEntre", () => {
  it("conta dias de calendário, inclusive em ano bissexto", () => {
    expect(diasEntre("2026-11-01", "2026-11-02")).toBe(1);
    expect(diasEntre("2024-02-28", "2024-03-01")).toBe(2);
    expect(diasEntre("2025-11-02", "2026-11-02")).toBe(365);
  });
});

describe("calcularCondicao", () => {
  it("sem manutenção registrada não inventa número", () => {
    expect(calcularCondicao([], HOJE)).toBeNull();
    expect(calcularCondicao([mod("2026-10-01", 50000)], HOJE)).toBeNull();
  });

  it("logo após a manutenção está em 100", () => {
    expect(calcularCondicao([man(HOJE, 50000)], HOJE)?.valor).toBe(100);
  });

  it("no vencimento do intervalo de tempo vale 50; no dobro, 0", () => {
    expect(calcularCondicao([man("2025-11-02")], HOJE)?.valor).toBe(50);
    expect(calcularCondicao([man("2024-11-02")], HOJE)?.valor).toBe(0);
  });

  it("o km conta quando há km atual registrado depois", () => {
    const c = calcularCondicao(
      [man("2026-11-01", 50000), mod("2026-11-02", 60000)],
      HOJE,
    );
    expect(c).toMatchObject({ valor: 50, kmDesde: 10000, diasDesde: 1 });
  });

  it("vale o pior entre tempo e km (o que vier primeiro)", () => {
    // 6 meses (≈25 pontos) e 8.000 km (40 pontos): vale o km.
    const c = calcularCondicao(
      [man("2026-05-02", 40000), mod("2026-11-01", 48000)],
      HOJE,
    );
    expect(c?.valor).toBe(60);
  });

  it("nova manutenção faz a Condição subir", () => {
    const antes = calcularCondicao([man("2025-11-02", 40000)], HOJE)!;
    const depois = calcularCondicao(
      [man("2025-11-02", 40000), man("2026-11-01", 52000)],
      HOJE,
    )!;
    expect(depois.valor).toBeGreaterThan(antes.valor);
    expect(depois.ultimaManutencao).toBe("2026-11-01");
  });

  it("km menor que o da manutenção (erro de digitação) não dá bônus", () => {
    const c = calcularCondicao(
      [man("2026-11-02", 50000), mod("2026-11-02", 1000)],
      HOJE,
    );
    expect(c).toMatchObject({ valor: 100, kmDesde: 0 });
  });

  it("manutenção sem km: só o tempo conta", () => {
    expect(
      calcularCondicao([man("2026-05-03"), mod(HOJE, 90000)], HOJE),
    ).toMatchObject({ kmDesde: null, valor: 75 });
  });

  it("fica sempre entre 0 e 100", () => {
    expect(calcularCondicao([man("2000-01-01", 0)], HOJE)?.valor).toBe(0);
  });
});
