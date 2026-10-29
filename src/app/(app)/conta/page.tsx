import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Botao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { sair } from "./acoes";
import { ExcluirConta } from "./excluir-conta";

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

      <section
        aria-labelledby="titulo-dados"
        className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-6"
      >
        <h2 id="titulo-dados" className="rotulo font-sans">
          Seus dados
        </h2>
        <p className="text-sm text-texto-secundario">
          Baixe uma cópia de tudo o que você registrou (perfil, carros,
          registros, itens, notas e histórico), em formato JSON. Veja a{" "}
          <Link href="/privacidade" className="text-destaque underline">
            Política de Privacidade
          </Link>
          .
        </p>
        {/* Link comum (não <Link>): é um download, não uma página. */}
        <a
          href="/conta/dados"
          download
          className="inline-flex min-h-11 items-center self-start rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
        >
          Baixar meus dados
        </a>
      </section>

      <form action={sair}>
        <Botao type="submit" variante="secundario">
          Sair da conta
        </Botao>
      </form>

      <section
        aria-labelledby="titulo-excluir"
        className="flex flex-col gap-3 border-t border-borda pt-8"
      >
        <h2 id="titulo-excluir" className="text-3xl">
          Excluir conta
        </h2>
        <p className="text-sm text-texto-secundario">
          Apaga sua conta e todos os seus dados. Não dá para desfazer.
        </p>
        <ExcluirConta nomeUsuario={perfil.nome_usuario} />
      </section>
    </>
  );
}
