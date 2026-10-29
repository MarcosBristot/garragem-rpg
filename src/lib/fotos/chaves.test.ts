import { describe, expect, it } from "vitest";
import {
  arquivoDaChave,
  chaveCapa,
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
