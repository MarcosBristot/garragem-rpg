"use server";

import { revalidatePath } from "next/cache";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

// Seguir e bloquear. As regras (sem bloqueio, só em nome próprio, bloquear
// desfaz o seguir) ficam na RLS e em triggers: aqui só repassamos.

async function revalidar(nomeUsuario: string) {
  revalidatePath("/feed");
  revalidatePath("/conta");
  revalidatePath(`/u/${nomeUsuario}`);
}

/** Lê o @ do alvo (para revalidar a página dele) e confere o id. */
async function alvo(perfilId: string) {
  const sessao = await exigirPerfil();
  if (!ehUuid(perfilId) || perfilId === sessao.perfil.id) return null;
  const { data } = await sessao.supabase
    .from("perfis")
    .select("id, nome_usuario")
    .eq("id", perfilId)
    .maybeSingle();
  return data ? { ...sessao, alvo: data } : null;
}

export async function seguir(perfilId: string): Promise<void> {
  const r = await alvo(perfilId);
  if (!r) return;
  // Já segue, ou há bloqueio: o banco recusa e nada muda.
  await r.supabase.from("seguidores").insert({ seguido_id: r.alvo.id });
  await revalidar(r.alvo.nome_usuario);
}

export async function deixarDeSeguir(perfilId: string): Promise<void> {
  const r = await alvo(perfilId);
  if (!r) return;
  await r.supabase
    .from("seguidores")
    .delete()
    .eq("seguidor_id", r.perfil.id)
    .eq("seguido_id", r.alvo.id);
  await revalidar(r.alvo.nome_usuario);
}

export async function bloquear(perfilId: string): Promise<void> {
  const r = await alvo(perfilId);
  if (!r) return;
  await r.supabase.from("bloqueios").insert({ bloqueado_id: r.alvo.id });
  await revalidar(r.alvo.nome_usuario);
}

export async function desbloquear(perfilId: string): Promise<void> {
  const r = await alvo(perfilId);
  if (!r) return;
  await r.supabase
    .from("bloqueios")
    .delete()
    .eq("bloqueador_id", r.perfil.id)
    .eq("bloqueado_id", r.alvo.id);
  await revalidar(r.alvo.nome_usuario);
}
