"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Botao, CaixaMarcacao, Campo } from "@/components/formulario";
import type { EstadoCarro, ValoresCarro } from "./acoes";

type Acao = (estado: EstadoCarro, form: FormData) => Promise<EstadoCarro>;

export function FormularioCarro({
  acao,
  valores,
  rotuloEnviar,
}: {
  acao: Acao;
  valores: ValoresCarro;
  rotuloEnviar: string;
}) {
  const [estado, enviar, enviando] = useActionState(acao, {
    valores,
    erros: {},
  });
  const v = estado.valores;

  return (
    <form action={enviar} className="flex flex-col gap-4" noValidate>
      <Campo
        id="marca"
        name="marca"
        rotulo="Marca"
        defaultValue={v.marca}
        required
        maxLength={40}
        erro={estado.erros.marca}
      />
      <Campo
        id="modelo"
        name="modelo"
        rotulo="Modelo"
        defaultValue={v.modelo}
        required
        maxLength={60}
        erro={estado.erros.modelo}
      />
      <Campo
        id="ano"
        name="ano"
        rotulo="Ano (opcional)"
        defaultValue={v.ano}
        inputMode="numeric"
        maxLength={4}
        erro={estado.erros.ano}
      />
      <Campo
        id="apelido"
        name="apelido"
        rotulo="Apelido (opcional)"
        defaultValue={v.apelido}
        maxLength={40}
        erro={estado.erros.apelido}
        dica="Como você chama o carro. Ex.: Prata, Bala, Vovô."
      />
      <CaixaMarcacao
        id="publico"
        name="publico"
        defaultChecked={v.publico}
        rotulo="Carro público"
        dica="Aparece no seu perfil público. Registros continuam com a visibilidade que você escolher em cada um."
      />
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/garagem"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-borda px-4 font-semibold hover:bg-borda/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          Cancelar
        </Link>
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : rotuloEnviar}
        </Botao>
      </div>
    </form>
  );
}
