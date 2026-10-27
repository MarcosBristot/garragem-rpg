"use client";

import { useActionState } from "react";
import { Botao, Campo } from "@/components/formulario";
import { entrar, type EstadoEntrar } from "./acoes";

const inicial: EstadoEntrar = { etapa: "email", email: "" };

export function FormularioEntrar() {
  const [estado, acao, enviando] = useActionState(entrar, inicial);

  if (estado.etapa === "email") {
    return (
      <form action={acao} className="flex flex-col gap-4" noValidate>
        <Campo
          id="email"
          name="email"
          type="email"
          rotulo="E-mail"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={estado.email}
          erro={estado.erro}
          dica="Enviamos um código de 6 dígitos. Sem senha."
        />
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Receber código"}
        </Botao>
      </form>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-texto-secundario" aria-live="polite">
        Enviamos o código para{" "}
        <strong className="text-texto">{estado.email}</strong>.
      </p>
      <Campo
        id="codigo"
        name="codigo"
        rotulo="Código"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={6}
        required
        autoFocus
        erro={estado.erro}
      />
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Conferindo…" : "Entrar"}
      </Botao>
      <Botao type="submit" name="voltar" value="1" variante="secundario">
        Usar outro e-mail
      </Botao>
    </form>
  );
}
