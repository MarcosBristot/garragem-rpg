import type { Metadata } from "next";
import { Suspense } from "react";
import { Botao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Conta · Garagem RPG" };

export default function PaginaConta() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10"
    >
      <h1 className="text-5xl">Conta</h1>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const { perfil } = await exigirPerfil();

  return (
    <>
      <section
        aria-labelledby="titulo-perfil"
        className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-6"
      >
        <h2 id="titulo-perfil" className="rotulo font-sans">
          Seu perfil
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-texto-secundario">Nome de usuário</dt>
            <dd>@{perfil.nome_usuario}</dd>
          </div>
          <div>
            <dt className="text-sm text-texto-secundario">Cidade</dt>
            <dd>{perfil.cidade ?? "Não informada"}</dd>
          </div>
        </dl>
      </section>

      <form action={sair}>
        <Botao type="submit" variante="secundario">
          Sair da conta
        </Botao>
      </form>
    </>
  );
}
