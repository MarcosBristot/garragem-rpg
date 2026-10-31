"use client";

import { useActionState } from "react";
import { AreaTexto, Botao, GrupoOpcoes } from "@/components/formulario";
import { MOTIVOS } from "@/dominio/denuncia";
import type { EstadoDenuncia } from "./acoes";

type Acao = (e: EstadoDenuncia, f: FormData) => Promise<EstadoDenuncia>;

const OPCOES = Object.entries(MOTIVOS).map(([valor, m]) => ({
  valor,
  rotulo: m.rotulo,
  descricao: m.descricao,
}));

export function FormularioDenuncia({ acao }: { acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, { erros: {} });

  if (estado.enviada) {
    return (
      <p role="status" className="rounded-2xl border border-condicao/50 p-5">
        Recebemos sua denúncia. Vamos analisar e, se o conteúdo violar os
        Termos, ele será removido. Obrigado por ajudar a manter a comunidade
        segura.
      </p>
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <GrupoOpcoes
        legenda="Motivo"
        name="motivo"
        opcoes={OPCOES}
        valor={estado.motivo ?? ""}
        erro={estado.erros.motivo}
      />
      <AreaTexto
        id="detalhes"
        name="detalhes"
        rotulo="Detalhes (opcional, exceto em 'Outro motivo')"
        defaultValue={estado.detalhes}
        maxLength={1000}
        erro={estado.erros.detalhes}
        dica="Não precisa colar dados pessoais aqui: só diga onde está o problema."
      />
      {estado.erros.alvo || estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erros.alvo ?? estado.erroGeral}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando} className="self-start">
        {enviando ? "Enviando…" : "Enviar denúncia"}
      </Botao>
    </form>
  );
}
