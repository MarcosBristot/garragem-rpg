"use server";

import { redirect } from "next/navigation";
import { validarDenuncia } from "@/dominio/denuncia";
import { usuarioLogado } from "@/lib/sessao";

export type EstadoDenuncia = {
  erros: { alvo?: string; motivo?: string; detalhes?: string };
  erroGeral?: string;
  enviada?: boolean;
  motivo?: string;
  detalhes?: string;
};

export async function enviarDenuncia(
  alvoTipo: string,
  alvoId: string,
  _estado: EstadoDenuncia,
  form: FormData,
): Promise<EstadoDenuncia> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const motivo = String(form.get("motivo") ?? "");
  const detalhes = String(form.get("detalhes") ?? "");
  const r = validarDenuncia({ alvoTipo, alvoId, motivo, detalhes });
  if (!r.ok) return { erros: r.erros, motivo, detalhes };

  // Sem .select(): o usuário não tem permissão de ler denúncias.
  const { error } = await supabase.from("denuncias").insert({
    alvo_tipo: r.dados.alvoTipo,
    alvo_id: r.dados.alvoId,
    motivo: r.dados.motivo,
    detalhes: r.dados.detalhes,
  });

  if (error?.code === "23505") return { erros: {}, enviada: true }; // já denunciou
  if (error?.code === "23514") {
    return {
      erros: {},
      erroGeral: "Você atingiu o limite de denúncias por hoje. Tente amanhã.",
      motivo,
      detalhes,
    };
  }
  if (error) {
    return {
      erros: {},
      erroGeral: "Não foi possível enviar. Tente de novo.",
      motivo,
      detalhes,
    };
  }
  return { erros: {}, enviada: true };
}
