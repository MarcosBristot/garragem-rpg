"use client";

import { useState } from "react";
import { Botao } from "@/components/formulario";

// Exclusão em dois passos: o primeiro clique só mostra o aviso.
export function ExcluirComConfirmacao({
  acao,
  rotulo,
  aviso,
}: {
  acao: () => Promise<void>;
  rotulo: string;
  aviso: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Botao
        type="button"
        variante="perigo"
        onClick={() => setConfirmando(true)}
      >
        {rotulo}
      </Botao>
    );
  }

  return (
    <form
      action={acao}
      className="flex flex-col gap-3 rounded-lg border border-red-400/60 p-4"
    >
      <p role="alert" className="text-sm">
        {aviso} Não dá para desfazer.
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
