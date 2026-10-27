"use server";

import { redirect } from "next/navigation";
import { validarPerfil, type ErrosPerfil } from "@/dominio/perfil";
import { usuarioLogado } from "@/lib/sessao";

// `valores` volta para o formulário: o React limpa os campos após o envio.
export type EstadoPerfil = {
  valores: Record<"nome_usuario" | "nome_exibicao" | "cidade", string>;
  erros: ErrosPerfil;
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
  if (!resultado.ok) return { valores, erros: resultado.erros };

  // O id vem da sessão validada, nunca do formulário. A RLS também
  // recusaria um id diferente de auth.uid().
  const { error } = await supabase.from("perfis").insert({
    id: usuarioId,
    nome_usuario: resultado.dados.nomeUsuario,
    nome_exibicao: resultado.dados.nomeExibicao,
    cidade: resultado.dados.cidade,
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
