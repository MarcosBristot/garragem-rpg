"use client";

import { useActionState } from "react";
import { Botao, Campo } from "@/components/formulario";
import type { EstadoOS } from "./acoes";

type Acao = (e: EstadoOS, f: FormData) => Promise<EstadoOS>;

export function FormularioOS({
  acao,
  valores,
  hoje,
}: {
  acao: Acao;
  valores: EstadoOS["valores"];
  hoje: string;
}) {
  const [estado, enviar, enviando] = useActionState(acao, {
    valores,
    erros: {},
  });
  const v = estado.valores;

  return (
    <form action={enviar} className="flex flex-col gap-4" noValidate>
      <Campo
        id="os-oficina"
        name="oficina"
        rotulo="Oficina (opcional)"
        defaultValue={v.oficina}
        maxLength={120}
        erro={estado.erros.oficina}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo
          id="os-data"
          name="data"
          type="date"
          rotulo="Data"
          defaultValue={v.data}
          max={hoje}
          erro={estado.erros.data}
        />
        <Campo
          id="os-km"
          name="km"
          rotulo="Km"
          inputMode="numeric"
          defaultValue={v.km}
          maxLength={10}
          erro={estado.erros.km}
        />
        <Campo
          id="os-total"
          name="total"
          rotulo="Total da OS"
          inputMode="decimal"
          placeholder="R$ 0,00"
          defaultValue={v.total}
          maxLength={16}
          erro={estado.erros.totalCentavos}
        />
      </div>
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar dados da OS"}
        </Botao>
        <p role="status" className="text-sm text-condicao">
          {estado.salvo && !enviando ? "Dados da OS salvos." : ""}
        </p>
      </div>
    </form>
  );
}
