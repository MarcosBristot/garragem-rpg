"use server";

import { usuarioLogado } from "@/lib/sessao";

/** Zera a bolinha do sino (o horário vem do relógio do banco). */
export async function marcarNotificacoesVistas(): Promise<void> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) return;
  await supabase.rpc("marcar_notificacoes_vistas");
}
