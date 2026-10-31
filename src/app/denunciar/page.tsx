import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CabecalhoPublico } from "@/components/cabecalho-publico";
import { usuarioLogado } from "@/lib/sessao";
import { enviarDenuncia } from "./acoes";
import { FormularioDenuncia } from "./formulario-denuncia";

export const metadata: Metadata = {
  title: "Denunciar · Garagem RPG",
  robots: { index: false },
};

export default function PaginaDenunciar({
  searchParams,
}: PageProps<"/denunciar">) {
  return (
    <>
      <CabecalhoPublico />
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
      >
        <h1 className="text-5xl">Denunciar conteúdo</h1>
        <Suspense
          fallback={<p className="text-texto-secundario">Carregando…</p>}
        >
          {searchParams.then((p) => (
            <Conteudo tipo={String(p.tipo ?? "")} id={String(p.id ?? "")} />
          ))}
        </Suspense>
      </main>
    </>
  );
}

async function Conteudo({ tipo, id }: { tipo: string; id: string }) {
  const { usuarioId } = await usuarioLogado();
  if (!usuarioId) {
    // Exigir conta reduz denúncias falsas em massa (robôs).
    return (
      <p className="text-texto-secundario">
        Para denunciar,{" "}
        <Link href="/entrar" className="text-destaque underline">
          entre na sua conta
        </Link>
        . Sem conta? Escreva para o contato no rodapé.
      </p>
    );
  }
  return <FormularioDenuncia acao={enviarDenuncia.bind(null, tipo, id)} />;
}
