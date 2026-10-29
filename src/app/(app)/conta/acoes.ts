"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ValoresPerfil } from "@/components/campos-perfil";
import { validarPerfil, type ErrosPerfil } from "@/dominio/perfil";
import { usuarioLogado } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

export type EstadoExclusao = { erro?: string };

/** Direito de eliminação (LGPD art. 18, VI). Não tem volta. */
export async function excluirConta(
  _estado: EstadoExclusao,
  form: FormData,
): Promise<EstadoExclusao> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome_usuario")
    .eq("id", usuarioId)
    .maybeSingle();
  const digitado = String(form.get("confirmacao") ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
  if (!perfil || digitado !== perfil.nome_usuario) {
    return { erro: "Digite seu nome de usuário exatamente como aparece." };
  }

  // A função do banco apaga auth.users; o resto vai em cascata.
  const { error } = await supabase.rpc("excluir_minha_conta");
  if (error) return { erro: "Não foi possível excluir agora. Tente de novo." };

  // A sessão já não vale (usuário apagado); limpa os cookies mesmo assim.
  await supabase.auth.signOut().catch(() => undefined);
  redirect("/conta-excluida");
}

export type EstadoEdicaoPerfil = {
  valores: ValoresPerfil;
  erros: ErrosPerfil;
  erroGeral?: string;
  salvo?: boolean;
};

/** Direito de correção (LGPD art. 18, III). */
export async function atualizarPerfil(
  _estado: EstadoEdicaoPerfil,
  form: FormData,
): Promise<EstadoEdicaoPerfil> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const valores: ValoresPerfil = {
    nome_usuario: String(form.get("nome_usuario") ?? ""),
    nome_exibicao: String(form.get("nome_exibicao") ?? ""),
    cidade: String(form.get("cidade") ?? ""),
  };
  const resultado = validarPerfil({
    nomeUsuario: valores.nome_usuario,
    nomeExibicao: valores.nome_exibicao,
    cidade: valores.cidade,
  });
  if (!resultado.ok) return { valores, erros: resultado.erros };

  // A RLS só deixa editar o próprio perfil, e só estas três colunas
  // têm permissão de UPDATE (o aceite dos termos fica intocável).
  const d = resultado.dados;
  const { error } = await supabase
    .from("perfis")
    .update({
      nome_usuario: d.nomeUsuario,
      nome_exibicao: d.nomeExibicao,
      cidade: d.cidade,
    })
    .eq("id", usuarioId);

  if (error?.code === "23505") {
    return {
      valores,
      erros: { nomeUsuario: "Esse nome de usuário já existe." },
    };
  }
  if (error) {
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
    };
  }

  revalidatePath("/conta");
  revalidatePath("/garagem");
  return {
    valores: {
      nome_usuario: d.nomeUsuario,
      nome_exibicao: d.nomeExibicao ?? "",
      cidade: d.cidade ?? "",
    },
    erros: {},
    salvo: true,
  };
}
