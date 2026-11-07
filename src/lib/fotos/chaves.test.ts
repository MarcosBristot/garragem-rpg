import { describe, expect, it } from "vitest";
import {
  arquivoDaChave,
  chaveCapa,
  chaveFotoOS,
  chaveFotoPerfil,
  chaveFotoPost,
  chaveFotoRegistro,
  prefixoCarro,
  prefixoUsuario,
} from "./chaves";

const U = "00000000-0000-0000-0000-00000000000a";
const C = "c0000000-0000-0000-0000-000000000001";
const R = "d0000000-0000-0000-0000-000000000001";
const F = "f0000000-0000-0000-0000-000000000001";

describe("chaves das fotos", () => {
  it("monta caminhos aninhados por usuário, carro e registro", () => {
    expect(chaveCapa(U, C, F)).toBe(`u/${U}/c/${C}/capa/${F}`);
    expect(chaveFotoRegistro(U, C, R, F)).toBe(`u/${U}/c/${C}/r/${R}/${F}`);
    expect(arquivoDaChave(chaveCapa(U, C, F), "mini")).toBe(
      `u/${U}/c/${C}/capa/${F}-mini.webp`,
    );
  });

  it("foto de perfil fica na pasta da pessoa, como o CHECK do banco pede", () => {
    expect(chaveFotoPerfil(U, F)).toBe(`u/${U}/perfil/${F}`);
    expect(chaveFotoPerfil(U, F).startsWith(prefixoUsuario(U))).toBe(true);
    expect(() => chaveFotoPerfil(U, "../x")).toThrow();
  });

  it("foto da OS fica dentro do registro (apagar o registro leva junto)", () => {
    expect(chaveFotoOS(U, C, R, F)).toBe(`u/${U}/c/${C}/r/${R}/os/${F}`);
  });

  it("foto do post fica no diretório do post, dentro do carro", () => {
    const P = "e0000000-0000-0000-0000-000000000001";
    expect(chaveFotoPost(U, C, P, F)).toBe(`u/${U}/c/${C}/p/${P}/${F}`);
    expect(chaveFotoPost(U, C, P, F).startsWith(prefixoCarro(U, C))).toBe(true);
    expect(() => chaveFotoPost(U, C, "../x", F)).toThrow();
  });

  it("tudo do carro fica sob o prefixo do carro, e tudo sob o do usuário", () => {
    const foto = chaveFotoRegistro(U, C, R, F);
    expect(foto.startsWith(prefixoCarro(U, C))).toBe(true);
    expect(foto.startsWith(prefixoUsuario(U))).toBe(true);
  });

  it.each(["../outro", "abc", `${U}/../x`, ""])(
    "recusa id que não é UUID (%j)",
    (malicioso) => {
      expect(() => prefixoUsuario(malicioso)).toThrow();
      expect(() => chaveCapa(U, malicioso, F)).toThrow();
    },
  );
});
