"use server";

import { redirect } from "next/navigation";
import type { ValoresPerfil } from "@/components/campos-perfil";
import { validarPerfil, type ErrosPerfil } from "@/dominio/perfil";
import { VERSAO_TERMOS } from "@/lib/empresa";
import { usuarioLogado } from "@/lib/sessao";

// `valores` volta para o formulário: o React limpa os campos após o envio.
export type EstadoPerfil = {
  valores: ValoresPerfil;
  erros: ErrosPerfil & { aceite?: string };
  erroGeral?: string;
};

export async function criarPerfil(
  _estado: EstadoPerfil,
  form: FormData,
): Promise<EstadoPerfil> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const valores = {
    nome_usuario: String(form.get("nome_usuario") ?? ""),
    nome_exibicao: String(form.get("nome_exibicao") ?? ""),
    cidade: String(form.get("cidade") ?? ""),
  };
  const resultado = validarPerfil({
    nomeUsuario: valores.nome_usuario,
    nomeExibicao: valores.nome_exibicao,
    cidade: valores.cidade,
  });
  // Aceite dos Termos e da Política (com declaração de 18+). Sem ele, o
  // banco também recusa o perfil (política RLS).
  const aceitou = form.get("aceite") === "on";
  if (!resultado.ok || !aceitou) {
    return {
      valores,
      erros: {
        ...(resultado.ok ? {} : resultado.erros),
        ...(aceitou
          ? {}
          : { aceite: "Para criar o perfil, aceite os termos e a política." }),
      },
    };
  }

  // O id vem da sessão validada, nunca do formulário. A RLS também
  // recusaria um id diferente de auth.uid().
  const { error } = await supabase.from("perfis").insert({
    id: usuarioId,
    nome_usuario: resultado.dados.nomeUsuario,
    nome_exibicao: resultado.dados.nomeExibicao,
    cidade: resultado.dados.cidade,
    termos_aceitos_em: new Date().toISOString(),
    versao_termos: VERSAO_TERMOS,
  });

  if (error) {
    // 23505 = violação de unicidade no Postgres.
    if (error.code === "23505" && error.message.includes("nome_usuario")) {
      return {
        valores,
        erros: { nomeUsuario: "Esse nome de usuário já existe." },
      };
    }
    if (error.code === "23505") redirect("/garagem"); // perfil já criado
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
    };
  }

  redirect("/garagem");
}
