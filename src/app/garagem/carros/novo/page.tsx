import type { Metadata } from "next";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { salvarCarro } from "../acoes";
import { FormularioCarro } from "../formulario-carro";

export const metadata: Metadata = { title: "Novo carro · Garagem RPG" };

export default function PaginaNovoCarro() {
  return (
    <Cartao>
      <h1 className="mb-6 text-2xl font-bold">Novo carro</h1>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </Cartao>
  );
}

async function Conteudo() {
  await exigirPerfil();
  return (
    <FormularioCarro
      acao={salvarCarro.bind(null, null)}
      valores={{ marca: "", modelo: "", ano: "", apelido: "", publico: false }}
      rotuloEnviar="Adicionar carro"
    />
  );
}
