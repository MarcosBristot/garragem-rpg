import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { nomeDoCarro } from "@/lib/carros";
import { exigirPerfil } from "@/lib/sessao";
import { FormularioPost } from "./formulario-post";

export const metadata: Metadata = { title: "Novo post · Garagem RPG" };

export default function PaginaNovoPost() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <Link
        href="/feed"
        className="inline-flex min-h-11 w-fit items-center text-sm text-texto-secundario hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque"
      >
        ← Feed
      </Link>
      <div>
        <h1 className="text-5xl">Novo post</h1>
        <p className="text-texto-secundario">
          Até 4 fotos de um carro seu. Quem tem conta no Garagem RPG vê.
        </p>
      </div>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const { supabase, perfil } = await exigirPerfil();
  // Só carros públicos: o post sempre leva ao carro (e a RLS exige isso).
  const { data: carros } = await supabase
    .from("carros")
    .select("id, apelido, marca, modelo")
    .eq("dono_id", perfil.id)
    .eq("publico", true)
    .order("criado_em");

  if (!carros || carros.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-borda bg-superficie p-6">
        <p className="text-texto-secundario">
          Para publicar, marque um carro como público (em Editar carro). Os
          registros continuam com a visibilidade que você escolheu.
        </p>
        <Link href="/garagem" className="text-destaque underline">
          Ir para a garagem
        </Link>
      </div>
    );
  }

  return (
    <FormularioPost
      carros={Object.fromEntries(carros.map((c) => [c.id, nomeDoCarro(c)]))}
    />
  );
}
