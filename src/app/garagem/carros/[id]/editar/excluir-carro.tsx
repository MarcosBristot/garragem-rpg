"use client";

import { useState } from "react";
import { Botao } from "@/components/formulario";

// Exclusão em dois passos: apagar o carro leva junto todo o diário dele.
export function ExcluirCarro({ acao }: { acao: () => Promise<void> }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Botao
        type="button"
        variante="perigo"
        onClick={() => setConfirmando(true)}
      >
        Excluir carro
      </Botao>
    );
  }

  return (
    <form
      action={acao}
      className="flex flex-col gap-3 rounded-lg border border-red-400/60 p-4"
    >
      <p role="alert" className="text-sm">
        Isso apaga o carro e todos os registros do diário dele. Não dá para
        desfazer.
      </p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Botao
          type="button"
          variante="secundario"
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </Botao>
        <Botao type="submit" variante="perigo" autoFocus>
          Sim, excluir
        </Botao>
      </div>
    </form>
  );
}
