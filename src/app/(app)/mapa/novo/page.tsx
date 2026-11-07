import type { Metadata } from "next";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { salvarEncontro } from "../acoes";
import { FormularioEncontro } from "../formulario-encontro";

export const metadata: Metadata = { title: "Criar encontro · Garagem RPG" };

export default function PaginaNovoEncontro() {
  return (
    <Cartao>
      <h1 className="text-4xl">Criar encontro</h1>
      <p className="mt-2 mb-6 text-texto-secundario">
        Aparece no mapa para quem tem conta. De quem vai, só o número é
        mostrado.
      </p>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </Cartao>
  );
}

async function Conteudo() {
  const { perfil } = await exigirPerfil();
  return (
    <FormularioEncontro
      acao={salvarEncontro.bind(null, null)}
      valores={{
        titulo: "",
        tipo: "encontro",
        descricao: "",
        local_nome: "",
        cidade: perfil.cidade ?? "",
        lat: "",
        lng: "",
        inicio: "",
        duracao: "4",
      }}
      rotuloEnviar="Criar encontro"
      voltarPara="/mapa"
    />
  );
}
