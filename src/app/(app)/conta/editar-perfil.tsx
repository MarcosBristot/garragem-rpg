"use client";

import { useActionState } from "react";
import { CamposPerfil, type ValoresPerfil } from "@/components/campos-perfil";
import { Botao } from "@/components/formulario";
import { atualizarPerfil } from "./acoes";

export function EditarPerfil({ valores }: { valores: ValoresPerfil }) {
  const [estado, acao, enviando] = useActionState(atualizarPerfil, {
    valores,
    erros: {},
  });

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <CamposPerfil valores={estado.valores} erros={estado.erros} />
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar perfil"}
        </Botao>
        {/* role=status: o leitor de tela anuncia sem roubar o foco. */}
        <p role="status" className="text-sm text-condicao">
          {estado.salvo && !enviando ? "Perfil atualizado." : ""}
        </p>
      </div>
    </form>
  );
}
