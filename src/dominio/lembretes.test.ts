import { describe, expect, it } from "vitest";
import {
  encontrosProximos,
  lembreteDoCarro,
  ordenarLembretes,
  sequenciaDeMeses,
} from "./lembretes";

describe("sequenciaDeMeses", () => {
  it("conta meses seguidos terminando no mês atual", () => {
    const s = sequenciaDeMeses(["2026-09", "2026-10", "2026-11"], "2026-11-08");
    expect(s.meses).toBe(3);
    expect(s.registrouEsteMes).toBe(true);
    expect(s.emRisco).toBe(false);
  });

  it("o mês em aberto não quebra a sequência", () => {
    const s = sequenciaDeMeses(["2026-09", "2026-10"], "2026-11-08");
    expect(s.meses).toBe(2);
    expect(s.registrouEsteMes).toBe(false);
    expect(s.emRisco).toBe(false); // ainda faltam 22 dias
  });

  it("entra em risco nos últimos 10 dias do mês", () => {
    expect(sequenciaDeMeses(["2026-10"], "2026-11-20").emRisco).toBe(true);
    expect(sequenciaDeMeses(["2026-10"], "2026-11-19").emRisco).toBe(false);
    expect(sequenciaDeMeses(["2026-10"], "2026-11-20").diasRestantes).toBe(10);
  });

  it("um mês pulado zera; registro antigo não conta", () => {
    expect(sequenciaDeMeses(["2026-08", "2026-09"], "2026-11-08").meses).toBe(
      0,
    );
    expect(sequenciaDeMeses([], "2026-11-30").emRisco).toBe(false);
  });

  it("atravessa a virada do ano e meses com repetição", () => {
    const s = sequenciaDeMeses(["2025-12", "2025-12", "2026-01"], "2026-01-15");
    expect(s.meses).toBe(2);
  });

  it("conhece o fim de fevereiro", () => {
    expect(sequenciaDeMeses([], "2028-02-20").diasRestantes).toBe(9);
    expect(sequenciaDeMeses([], "2027-02-20").diasRestantes).toBe(8);
  });
});

describe("lembreteDoCarro", () => {
  const manutencao = (data: string, km: number | null = null) => ({
    tipo: "manutencao" as const,
    data,
    km,
  });

  it("carro sem manutenção pede o primeiro registro", () => {
    expect(lembreteDoCarro([], "2026-11-08")).toEqual({
      tipo: "sem_manutencao",
      condicao: null,
    });
  });

  it("em dia não incomoda", () => {
    expect(
      lembreteDoCarro([manutencao("2026-10-01")], "2026-11-08"),
    ).toBeNull();
  });

  it("perto de vencer avisa; vencida avisa com urgência", () => {
    // 80% de 365 dias = 292 dias: Condição 60.
    expect(lembreteDoCarro([manutencao("2026-01-20")], "2026-11-08")).toEqual({
      tipo: "atencao",
      condicao: 60,
    });
    expect(
      lembreteDoCarro([manutencao("2025-11-08")], "2026-11-08")?.tipo,
    ).toBe("vencida");
  });

  it("km alto também vence a revisão", () => {
    const r = lembreteDoCarro(
      [
        manutencao("2026-10-01", 50_000),
        { tipo: "modificacao", data: "2026-11-01", km: 61_000 },
      ],
      "2026-11-08",
    );
    expect(r?.tipo).toBe("vencida");
  });
});

describe("ordenarLembretes", () => {
  it("pior Condição primeiro; sem manutenção por último", () => {
    const item = (condicao: number | null, nome: string) => ({
      nome,
      lembrete: {
        tipo:
          condicao === null
            ? ("sem_manutencao" as const)
            : ("atencao" as const),
        condicao,
      },
    });
    expect(
      ordenarLembretes([item(null, "c"), item(58, "b"), item(20, "a")]).map(
        (i) => i.nome,
      ),
    ).toEqual(["a", "b", "c"]);
  });
});

describe("encontrosProximos", () => {
  const agora = new Date("2026-11-08T12:00:00Z");
  const e = (id: string, inicio: string, fim: string) => ({
    id,
    titulo: id,
    local_nome: "Lugar",
    inicio,
    fim,
  });

  it("pega só o que começa em até 48 h, do mais próximo ao mais distante", () => {
    const r = encontrosProximos(
      [
        e("depois", "2026-11-10T11:00:00Z", "2026-11-10T15:00:00Z"),
        e("logo", "2026-11-08T20:00:00Z", "2026-11-08T23:00:00Z"),
        e("longe", "2026-11-10T13:00:00Z", "2026-11-10T15:00:00Z"),
      ],
      agora,
    );
    expect(r.map((x) => x.id)).toEqual(["logo", "depois"]);
  });

  it("em andamento entra; já terminado não", () => {
    const r = encontrosProximos(
      [
        e("agora", "2026-11-08T10:00:00Z", "2026-11-08T14:00:00Z"),
        e("acabou", "2026-11-08T08:00:00Z", "2026-11-08T11:59:00Z"),
      ],
      agora,
    );
    expect(r.map((x) => x.id)).toEqual(["agora"]);
  });

  it("organizo e confirmei: aparece uma vez só", () => {
    const x = e("a", "2026-11-08T20:00:00Z", "2026-11-08T23:00:00Z");
    expect(encontrosProximos([x, x], agora)).toHaveLength(1);
  });
});
