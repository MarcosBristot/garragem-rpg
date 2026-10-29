"use client";

import { useActionState } from "react";
import { Botao, Campo, Selecao } from "@/components/formulario";
import { CATEGORIAS, ESPACOS } from "@/dominio/item";
import type { EstadoItem } from "./acoes";
import { VALORES_ITEM_VAZIOS } from "./valores";

type Acao = (estado: EstadoItem, form: FormData) => Promise<EstadoItem>;

export function FormularioItem({ acao }: { acao: Acao }) {
  const [estado, enviar, enviando] = useActionState(acao, {
    valores: VALORES_ITEM_VAZIOS,
    erros: {},
    versao: 0,
  });
  const v = estado.valores;

  return (
    <form
      // Recriado a cada resposta (ver EstadoItem.versao).
      key={estado.versao}
      action={enviar}
      className="flex flex-col gap-4 rounded-xl border border-borda p-4"
      noValidate
    >
      <h3 className="font-semibold">Adicionar item</h3>
      <Campo
        id="descricao"
        name="descricao"
        rotulo="Descrição"
        defaultValue={v.descricao}
        maxLength={120}
        required
        erro={estado.erros.descricao}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          id="categoria"
          name="categoria"
          rotulo="Categoria"
          opcoes={CATEGORIAS}
          defaultValue={v.categoria}
          erro={estado.erros.categoria}
        />
        <Selecao
          id="espaco"
          name="espaco"
          rotulo="Espaço (opcional)"
          opcoes={ESPACOS}
          vazio="Nenhum"
          defaultValue={v.espaco}
          erro={estado.erros.espaco}
        />
        <Campo
          id="quantidade"
          name="quantidade"
          rotulo="Quantidade"
          defaultValue={v.quantidade}
          inputMode="decimal"
          maxLength={11}
          erro={estado.erros.quantidade}
        />
        <Campo
          id="valor"
          name="valor"
          rotulo="Valor total (opcional)"
          defaultValue={v.valor}
          inputMode="decimal"
          maxLength={16}
          placeholder="R$ 0,00"
          erro={estado.erros.valorCentavos}
        />
      </div>
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando} className="sm:self-end">
        {enviando ? "Adicionando…" : "Adicionar item"}
      </Botao>
    </form>
  );
}
