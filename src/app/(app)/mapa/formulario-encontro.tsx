"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useActionState, useState } from "react";
import { AreaTexto, Botao, Campo, Selecao } from "@/components/formulario";
import { DURACOES, TIPOS_ENCONTRO } from "@/dominio/encontro";
import type { EstadoEncontro, ValoresEncontro } from "./acoes";

// O mapa só existe no navegador (WebGL); enquanto carrega, um espaço cinza.
const MapaEncontros = dynamic(
  () => import("@/components/mapa/mapa-encontros").then((m) => m.MapaEncontros),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-superficie-2" />,
  },
);

type Acao = (estado: EstadoEncontro, form: FormData) => Promise<EstadoEncontro>;

export function FormularioEncontro({
  acao,
  valores,
  rotuloEnviar,
  voltarPara,
}: {
  acao: Acao;
  valores: ValoresEncontro;
  rotuloEnviar: string;
  voltarPara: string;
}) {
  const [estado, enviar, enviando] = useActionState(acao, {
    valores,
    erros: {},
    versao: 0,
  });
  const v = estado.valores;
  const inicial =
    v.lat && v.lng ? { lat: Number(v.lat), lng: Number(v.lng) } : null;
  const [ponto, setPonto] = useState(inicial);

  return (
    <form
      // Recriado a cada resposta (selects e mapa voltam ao valor enviado).
      key={estado.versao}
      action={enviar}
      className="flex flex-col gap-5"
      noValidate
    >
      <Campo
        id="titulo"
        name="titulo"
        rotulo="Nome do encontro"
        defaultValue={v.titulo}
        maxLength={80}
        required
        erro={estado.erros.titulo}
        dica="Ex.: Encontro de hatches no domingo"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          id="tipo"
          name="tipo"
          rotulo="Tipo"
          opcoes={TIPOS_ENCONTRO}
          defaultValue={v.tipo}
          erro={estado.erros.tipo}
        />
        <Selecao
          id="duracao"
          name="duracao"
          rotulo="Duração"
          opcoes={DURACOES}
          defaultValue={v.duracao}
          erro={estado.erros.duracao}
        />
      </div>
      <Campo
        id="inicio"
        name="inicio"
        type="datetime-local"
        rotulo="Começa em"
        defaultValue={v.inicio}
        required
        erro={estado.erros.inicio}
        dica="Horário de Brasília."
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Ponto de encontro</legend>
        <p
          id="ponto-dica"
          className="rounded-xl border border-borda bg-superficie-2 p-3 text-sm text-texto-secundario"
        >
          Toque no mapa para marcar. Escolha um <strong>lugar público</strong>{" "}
          (estacionamento, praça, posto), nunca sua casa ou onde o carro fica.
          Aproxime com os botões + e −, ou com dois dedos.
        </p>
        <div className="h-72 overflow-hidden rounded-2xl border border-borda sm:h-96">
          <MapaEncontros
            modo="escolher"
            ponto={inicial}
            aoEscolher={setPonto}
            rotulo="Mapa para marcar o ponto de encontro"
          />
        </div>
        <input
          type="hidden"
          name="lat"
          value={ponto ? ponto.lat.toFixed(5) : ""}
        />
        <input
          type="hidden"
          name="lng"
          value={ponto ? ponto.lng.toFixed(5) : ""}
        />
        <p
          role="status"
          className={`text-sm ${estado.erros.ponto && !ponto ? "text-erro" : "text-texto-secundario"}`}
        >
          {ponto
            ? "Ponto marcado. Arraste o alfinete para ajustar."
            : (estado.erros.ponto ?? "Nenhum ponto marcado ainda.")}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="local_nome"
          name="local_nome"
          rotulo="Nome do lugar"
          defaultValue={v.local_nome}
          maxLength={120}
          required
          erro={estado.erros.local}
          dica="Como as pessoas acham o lugar."
        />
        <Campo
          id="cidade"
          name="cidade"
          rotulo="Cidade (opcional)"
          defaultValue={v.cidade}
          maxLength={80}
          erro={estado.erros.cidade}
        />
      </div>
      <AreaTexto
        id="descricao"
        name="descricao"
        rotulo="Detalhes (opcional)"
        defaultValue={v.descricao}
        maxLength={1000}
        erro={estado.erros.descricao}
        dica="Regras, programação, se é aberto a todos os carros…"
      />

      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-erro">
          {estado.erroGeral}
        </p>
      ) : null}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={voltarPara}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-borda px-4 font-semibold hover:bg-borda/50"
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
