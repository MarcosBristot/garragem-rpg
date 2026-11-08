import { describe, expect, it } from "vitest";
import { mensagemFalhaEnvio } from "./login";

describe("mensagemFalhaEnvio", () => {
  it("limite de tentativas pede para esperar", () => {
    expect(mensagemFalhaEnvio(429)).toMatch(/Espere/);
  });
  it("falha do serviço não culpa quem digitou", () => {
    expect(mensagemFalhaEnvio(500)).toMatch(/problema agora/);
    expect(mensagemFalhaEnvio(503)).toMatch(/problema agora/);
  });
  it("demais casos pedem para conferir o e-mail", () => {
    expect(mensagemFalhaEnvio(400)).toMatch(/Confira/);
    expect(mensagemFalhaEnvio(undefined)).toMatch(/Confira/);
  });
});
