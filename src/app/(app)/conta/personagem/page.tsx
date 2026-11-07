import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { personagemDoPerfil } from "@/dominio/personagem";
import { exigirPerfil } from "@/lib/sessao";
import { EditorPersonagem } from "./editor-personagem";

export const metadata: Metadata = { title: "Seu personagem · LifeInGears" };

export default function PaginaPersonagem() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <Link
        href="/conta"
        className="inline-flex min-h-11 w-fit items-center text-sm text-texto-secundario hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque"
      >
        ← Conta
      </Link>
      <div>
        <h1 className="text-5xl">Seu personagem</h1>
        <p className="text-texto-secundario">
          Aparece no seu perfil público e ao lado dos seus posts.
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
  const { data } = await supabase
    .from("perfis")
    .select("personagem")
    .eq("id", perfil.id)
    .maybeSingle();

  return (
    <EditorPersonagem
      inicial={personagemDoPerfil(data?.personagem, perfil.id)}
      nomeUsuario={perfil.nome_usuario}
    />
  );
}
