import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { usuarioLogado } from "@/lib/sessao";
import { FormularioPerfil } from "./formulario-perfil";

export const metadata: Metadata = { title: "Criar perfil · Garagem RPG" };

// Com Cache Components, o que lê cookies fica dentro de <Suspense>:
// o título sai na hora (casca estática) e o resto chega por streaming.
export default function PaginaNovoPerfil() {
  return (
    <Cartao>
      <h1 className="mb-2 text-4xl">Crie seu perfil</h1>
      <p className="mb-6 text-texto-secundario">
        Falta pouco para abrir sua garagem.
      </p>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </Cartao>
  );
}

async function Conteudo() {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id")
    .eq("id", usuarioId)
    .maybeSingle();
  if (perfil) redirect("/garagem");

  return <FormularioPerfil />;
}
