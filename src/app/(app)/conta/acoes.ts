"use server";

import { redirect } from "next/navigation";
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
