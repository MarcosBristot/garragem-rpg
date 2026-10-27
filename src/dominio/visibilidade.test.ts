import { describe, expect, it } from "vitest";
import {
  registroVisivelPara,
  VISIBILIDADE_PADRAO,
  type Registro,
  type Visibilidade,
} from "./visibilidade";

const DONO = "usuario-dono";
const OUTRO = "usuario-outro";

function registro(visibilidade: Visibilidade): Registro {
  return {
    id: "registro-1",
    donoId: DONO,
    visibilidade,
    titulo: "Troca de óleo",
    notas: "Nota fictícia do dono",
    itens: [
      {
        descricao: "Óleo 5W30",
        categoria: "motor",
        quantidade: 4,
        valorCentavos: 18000,
      },
    ],
  };
}

describe("registroVisivelPara", () => {
  it("o padrão é privado", () => {
    expect(VISIBILIDADE_PADRAO).toBe("privado");
  });

  it.each<Visibilidade>(["privado", "publico_sem_valor", "publico"])(
    "dono vê tudo quando %s",
    (v) => {
      expect(registroVisivelPara(registro(v), DONO)).toEqual(registro(v));
    },
  );

  it.each([OUTRO, null])("privado não aparece para %s", (quem) => {
    expect(registroVisivelPara(registro("privado"), quem)).toBeNull();
  });

  it.each([OUTRO, null])("publico_sem_valor esconde valores de %s", (quem) => {
    const visto = registroVisivelPara(registro("publico_sem_valor"), quem);
    expect(visto?.titulo).toBe("Troca de óleo");
    expect(visto?.itens[0]).not.toHaveProperty("valorCentavos");
    expect(JSON.stringify(visto)).not.toContain("18000");
  });

  it("publico mostra valores", () => {
    const visto = registroVisivelPara(registro("publico"), OUTRO);
    expect(visto?.itens[0].valorCentavos).toBe(18000);
  });

  it.each<Visibilidade>(["publico_sem_valor", "publico"])(
    "notas nunca saem para quem não é dono (%s)",
    (v) => {
      const visto = registroVisivelPara(registro(v), null);
      expect(visto).not.toHaveProperty("notas");
      expect(JSON.stringify(visto)).not.toContain("Nota fictícia");
    },
  );
});
