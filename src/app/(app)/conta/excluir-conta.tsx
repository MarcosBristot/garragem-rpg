"use client";

import { useActionState, useState } from "react";
import { Botao, Campo } from "@/components/formulario";
import { excluirConta } from "./acoes";

export function ExcluirConta({ nomeUsuario }: { nomeUsuario: string }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(excluirConta, {});

  if (!aberto) {
    return (
      <Botao
        type="button"
        variante="perigo"
        onClick={() => setAberto(true)}
        className="self-start"
      >
        Excluir minha conta
      </Botao>
    );
  }

  return (
    <form
      action={acao}
      className="flex flex-col gap-4 rounded-2xl border border-red-400/60 p-5"
    >
      <p role="alert" className="text-sm">
        Isso apaga <strong>na hora e para sempre</strong> seu perfil, carros,
        registros, itens, notas e histórico. Se quiser uma cópia, baixe seus
        dados antes.
      </p>
      <Campo
        id="confirmacao"
        name="confirmacao"
        rotulo={`Para confirmar, digite seu nome de usuário: ${nomeUsuario}`}
        autoComplete="off"
        autoCapitalize="none"
        autoFocus
        erro={estado.erro}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Botao
          type="button"
          variante="secundario"
          onClick={() => setAberto(false)}
        >
          Cancelar
        </Botao>
        <Botao type="submit" variante="perigo" disabled={enviando}>
          {enviando ? "Excluindo…" : "Excluir definitivamente"}
        </Botao>
      </div>
    </form>
  );
}
