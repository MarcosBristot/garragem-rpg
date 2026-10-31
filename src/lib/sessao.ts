import { redirect } from "next/navigation";
import { connection } from "next/server";
import { VERSAO_TERMOS } from "./empresa";
import { criarClienteServidor } from "./supabase/servidor";

// getClaims() valida o token; nunca confie no usuário vindo de getSession()
// no servidor, porque cookies podem ser forjados.
export async function usuarioLogado() {
  // Sessão é sempre por requisição: para a pré-renderização aqui. Sem isso,
  // o Next reclama do Date.now() que o Supabase usa para checar a expiração.
  await connection();
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  return { supabase, usuarioId: data?.claims.sub ?? null };
}

/**
 * Para páginas que exigem login e perfil criado. Se os Termos mudaram desde
 * o último aceite, manda para /termos-atualizados. Exceção: a página Conta
 * (`aceiteOpcional`), para quem discordar poder baixar os dados e excluir
 * a conta sem aceitar (LGPD).
 */
export async function exigirPerfil({ aceiteOpcional = false } = {}) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome_usuario, nome_exibicao, cidade, versao_termos")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!perfil) redirect("/perfil/novo");
  if (!aceiteOpcional && perfil.versao_termos !== VERSAO_TERMOS) {
    redirect("/termos-atualizados");
  }

  return { supabase, perfil };
}
