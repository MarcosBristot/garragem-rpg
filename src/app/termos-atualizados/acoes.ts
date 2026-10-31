"use server";

import { redirect } from "next/navigation";
import { VERSAO_TERMOS } from "@/lib/empresa";
import { usuarioLogado } from "@/lib/sessao";

export type EstadoAceite = { erro?: string };

export async function aceitarTermos(
  _estado: EstadoAceite,
  form: FormData,
): Promise<EstadoAceite> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (form.get("aceite") !== "on") {
    return { erro: "Marque a caixa para aceitar e continuar." };
  }
  // A função do banco grava a data de agora; o usuário não escreve nela.
  const { error } = await supabase.rpc("aceitar_termos", {
    p_versao: VERSAO_TERMOS,
  });
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  redirect("/garagem");
}
