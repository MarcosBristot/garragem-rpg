import { describe, expect, it } from "vitest";
import { espacosOcupados, montarEquipamento } from "./equipamento";

describe("montarEquipamento", () => {
  it("todos os espaços começam vazios", () => {
    const eq = montarEquipamento([]);
    expect(Object.keys(eq)).toEqual([
      "motor",
      "suspensao",
      "rodas",
      "freios",
      "estetica",
      "som",
    ]);
    expect(eq.motor).toEqual({ atual: null, total: 0 });
    expect(espacosOcupados(eq)).toBe(0);
  });

  it("a peça mais recente de cada espaço fica equipada", () => {
    const eq = montarEquipamento([
      {
        data: "2026-10-01",
        itens: [{ descricao: "Rodas aro 14", espaco: "rodas" }],
      },
      {
        data: "2026-11-01",
        itens: [{ descricao: "Rodas aro 15", espaco: "rodas" }],
      },
      {
        data: "2026-09-01",
        itens: [{ descricao: "Rodas aro 13", espaco: "rodas" }],
      },
    ]);
    expect(eq.rodas).toEqual({
      atual: { descricao: "Rodas aro 15", data: "2026-11-01" },
      total: 3,
    });
  });

  it("no mesmo dia, vence o item adicionado por último", () => {
    const eq = montarEquipamento([
      {
        data: "2026-11-01",
        itens: [
          {
            descricao: "Pastilha B",
            espaco: "freios",
            criado_em: "2026-11-01T12:00:00Z",
          },
          {
            descricao: "Pastilha A",
            espaco: "freios",
            criado_em: "2026-11-01T10:00:00Z",
          },
        ],
      },
    ]);
    expect(eq.freios.atual?.descricao).toBe("Pastilha B");
  });

  it("ignora itens sem espaço, espaço desconhecido ou sem descrição", () => {
    const eq = montarEquipamento([
      {
        data: "2026-11-01",
        itens: [
          { descricao: "Óleo", espaco: null },
          { descricao: "Turbo", espaco: "toString" },
          { descricao: "  ", espaco: "motor" },
          { descricao: "Filtro de ar", espaco: "motor" },
        ],
      },
      { data: null, itens: [{ descricao: "Sem data", espaco: "som" }] },
    ]);
    expect(eq.motor).toEqual({
      atual: { descricao: "Filtro de ar", data: "2026-11-01" },
      total: 1,
    });
    expect(eq.som.atual).toBeNull();
    expect(espacosOcupados(eq)).toBe(1);
  });
});
