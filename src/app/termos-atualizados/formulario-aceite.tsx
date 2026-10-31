"use client";

import { useActionState } from "react";
import { Botao } from "@/components/formulario";
import { aceitarTermos } from "./acoes";

export function FormularioAceite() {
  const [estado, acao, enviando] = useActionState(aceitarTermos, {});
  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <label
        htmlFor="aceite"
        className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"
      >
        <input
          id="aceite"
          name="aceite"
          type="checkbox"
          aria-invalid={estado.erro ? true : undefined}
          aria-describedby={estado.erro ? "aceite-erro" : undefined}
          className="mt-0.5 size-5 shrink-0 accent-destaque"
        />
        Li e aceito a nova versão dos Termos de Serviço e da Política de
        Privacidade.
      </label>
      {estado.erro ? (
        <p id="aceite-erro" role="alert" className="text-sm text-red-300">
          {estado.erro}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando} className="self-start">
        {enviando ? "Salvando…" : "Aceitar e continuar"}
      </Botao>
    </form>
  );
}
