"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AreaTexto, Botao, Campo, GrupoOpcoes } from "@/components/formulario";
import { TIPOS, VISIBILIDADES } from "@/dominio/registro";
import type { EstadoRegistro, ValoresRegistro } from "./acoes";

type Acao = (estado: EstadoRegistro, form: FormData) => Promise<EstadoRegistro>;

const OPCOES_TIPO = Object.entries(TIPOS).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));
const OPCOES_VISIBILIDADE = Object.entries(VISIBILIDADES).map(
  ([valor, { rotulo, descricao }]) => ({ valor, rotulo, descricao }),
);

export function FormularioRegistro({
  acao,
  valores,
  hoje,
  rotuloEnviar,
  voltarPara,
}: {
  acao: Acao;
  valores: ValoresRegistro;
  /** AAAA-MM-DD, calculado no servidor (fuso de São Paulo). */
  hoje: string;
  rotuloEnviar: string;
  voltarPara: string;
}) {
  const [estado, enviar, enviando] = useActionState(acao, {
    valores,
    erros: {},
  });
  const v = estado.valores;

  return (
    <form action={enviar} className="flex flex-col gap-5" noValidate>
      <GrupoOpcoes
        legenda="Tipo"
        name="tipo"
        opcoes={OPCOES_TIPO}
        valor={v.tipo}
        erro={estado.erros.tipo}
      />
      <Campo
        id="titulo"
        name="titulo"
        rotulo="Título"
        defaultValue={v.titulo}
        required
        maxLength={120}
        erro={estado.erros.titulo}
        dica="Ex.: Troca de óleo e filtro, Rodas aro 15."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          id="data"
          name="data"
          type="date"
          rotulo="Data"
          defaultValue={v.data}
          max={hoje}
          required
          erro={estado.erros.data}
        />
        <Campo
          id="km"
          name="km"
          rotulo="Km (opcional)"
          defaultValue={v.km}
          inputMode="numeric"
          maxLength={10}
          erro={estado.erros.km}
          dica="Quilometragem no dia."
        />
      </div>
      <AreaTexto
        id="notas"
        name="notas"
        rotulo="Notas (opcional)"
        defaultValue={v.notas}
        maxLength={5000}
        erro={estado.erros.notas}
        dica="Sempre privadas: nunca aparecem em páginas públicas."
      />
      <GrupoOpcoes
        legenda="Quem pode ver"
        name="visibilidade"
        opcoes={OPCOES_VISIBILIDADE}
        valor={v.visibilidade}
        erro={estado.erros.visibilidade}
      />
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={voltarPara}
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
