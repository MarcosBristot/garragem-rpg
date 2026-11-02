import { describe, expect, it } from "vitest";
import {
  CAMPOS,
  CORES,
  CORES_CABELO,
  PELES,
  coresDoPersonagem,
  personagemDoPerfil,
  personagemPadrao,
  validarPersonagem,
  type Personagem,
} from "./personagem";

const ID_A = "00000000-0000-0000-0000-00000000000a";
const ID_B = "00000000-0000-0000-0000-00000000000b";

const valido: Personagem = {
  pele: "t3",
  cabelo: "topete",
  corCabelo: "preto",
  roupa: "macacao",
  corRoupa: "ambar",
  corCalca: "grafite",
  acessorio: "bone",
};

describe("personagemPadrao", () => {
  it("é sempre o mesmo para o mesmo id", () => {
    expect(personagemPadrao(ID_A)).toEqual(personagemPadrao(ID_A));
  });

  it("varia entre pessoas", () => {
    const ids = Array.from({ length: 50 }, (_, i) => `id-${i}`);
    const unicos = new Set(
      ids.map((id) => JSON.stringify(personagemPadrao(id))),
    );
    expect(unicos.size).toBeGreaterThan(40);
    expect(personagemPadrao(ID_A)).not.toEqual(personagemPadrao(ID_B));
  });

  it("só usa opções válidas", () => {
    for (let i = 0; i < 200; i++) {
      expect(validarPersonagem(personagemPadrao(`id-${i}`))).not.toBeNull();
    }
  });
});

describe("validarPersonagem", () => {
  it("aceita um personagem completo e devolve só os campos conhecidos", () => {
    expect(validarPersonagem({ ...valido, extra: "<script>" })).toEqual(valido);
  });

  it("recusa campo faltando, valor desconhecido ou herdado do objeto", () => {
    const semAcessorio: Partial<Personagem> = { ...valido };
    delete semAcessorio.acessorio;
    expect(validarPersonagem(semAcessorio)).toBeNull();
    expect(validarPersonagem({ ...valido, pele: "t9" })).toBeNull();
    expect(validarPersonagem({ ...valido, cabelo: "toString" })).toBeNull();
    expect(validarPersonagem({ ...valido, corRoupa: 3 })).toBeNull();
  });

  it("recusa o que não é objeto", () => {
    for (const entrada of [null, undefined, "x", 1, [], [valido]]) {
      expect(validarPersonagem(entrada)).toBeNull();
    }
  });
});

describe("personagemDoPerfil", () => {
  it("usa o salvo quando é válido", () => {
    expect(personagemDoPerfil(valido, ID_A)).toEqual(valido);
  });

  it("cai no padrão quando não há nada salvo ou o salvo é inválido", () => {
    expect(personagemDoPerfil(null, ID_A)).toEqual(personagemPadrao(ID_A));
    expect(personagemDoPerfil({ pele: "t1" }, ID_A)).toEqual(
      personagemPadrao(ID_A),
    );
  });
});

describe("coresDoPersonagem", () => {
  it("macacão pinta as pernas com a cor da roupa", () => {
    expect(coresDoPersonagem(valido).calca).toBe(CORES.ambar.cor);
    expect(coresDoPersonagem({ ...valido, roupa: "camiseta" }).calca).toBe(
      CORES.grafite.cor,
    );
  });

  it("todas as cores são hex de 6 dígitos", () => {
    for (const lista of [PELES, CORES_CABELO, CORES]) {
      for (const { cor } of Object.values(lista)) {
        expect(cor).toMatch(/^#[0-9A-F]{6}$/);
      }
    }
  });

  it("todo campo tem pelo menos duas opções", () => {
    for (const lista of Object.values(CAMPOS)) {
      expect(Object.keys(lista).length).toBeGreaterThanOrEqual(2);
    }
  });
});
