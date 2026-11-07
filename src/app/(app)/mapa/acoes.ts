"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarEncontro, type ErrosEncontro } from "@/dominio/encontro";
import { registrarFalha } from "@/lib/log";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

// Encontros (Fase 5). Quem vê, quem edita, datas e limite diário são
// garantidos no banco (RLS + gatilho); aqui validamos para dar a mensagem
// certa e repassamos.

export type ValoresEncontro = {
  titulo: string;
  tipo: string;
  descricao: string;
  local_nome: string;
  cidade: string;
  lat: string;
  lng: string;
  inicio: string;
  duracao: string;
};

export type EstadoEncontro = {
  valores: ValoresEncontro;
  erros: ErrosEncontro;
  erroGeral?: string;
  /** Muda a cada resposta: recria o form (selects voltam ao valor certo). */
  versao: number;
};

const CAMPOS: (keyof ValoresEncontro)[] = [
  "titulo",
  "tipo",
  "descricao",
  "local_nome",
  "cidade",
  "lat",
  "lng",
  "inicio",
  "duracao",
];

/** Cria (id null) ou edita. O id vem de .bind() na página. */
export async function salvarEncontro(
  id: string | null,
  estado: EstadoEncontro,
  form: FormData,
): Promise<EstadoEncontro> {
  const { supabase } = await exigirPerfil();
  const valores = Object.fromEntries(
    CAMPOS.map((c) => [c, String(form.get(c) ?? "")]),
  ) as ValoresEncontro;
  const versao = estado.versao + 1;

  const r = validarEncontro(valores, new Date());
  if (!r.ok) return { valores, erros: r.erros, versao };
  if (id !== null && !ehUuid(id)) {
    return {
      valores,
      erros: {},
      erroGeral: "Encontro não encontrado.",
      versao,
    };
  }

  const { data, error } =
    id === null
      ? await supabase.from("encontros").insert(r.dados).select("id")
      : await supabase
          .from("encontros")
          .update(r.dados)
          .eq("id", id)
          .select("id");

  if (error?.code === "23514") {
    return {
      valores,
      erros: {},
      erroGeral: error.message.includes("Limite")
        ? "Você chegou ao limite de 5 encontros criados hoje."
        : "Confira a data: o encontro precisa ser no futuro (até 6 meses).",
      versao,
    };
  }
  if (error) {
    registrarFalha("mapa: salvar encontro", error);
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
      versao,
    };
  }
  // Update sem linha: não existe ou não é de quem pediu (mesma mensagem).
  if (data.length === 0) {
    return {
      valores,
      erros: {},
      erroGeral: "Encontro não encontrado.",
      versao,
    };
  }

  revalidatePath("/mapa");
  redirect(`/mapa/${data[0].id}${id === null ? "?novo=1" : ""}`);
}

export async function apagarEncontro(id: string): Promise<void> {
  const { supabase } = await exigirPerfil();
  if (ehUuid(id)) {
    // A RLS só deixa o organizador apagar; presenças vão junto (CASCADE).
    await supabase.from("encontros").delete().eq("id", id);
  }
  revalidatePath("/mapa");
  redirect("/mapa");
}

/** "Vou" / "Não vou mais". */
export async function alternarPresenca(
  id: string,
  vou: boolean,
): Promise<void> {
  const { supabase, perfil } = await exigirPerfil();
  if (!ehUuid(id)) return;
  if (vou) {
    // Encontro que já acabou ou que a pessoa não pode ver: o banco recusa.
    await supabase.from("presencas").insert({ encontro_id: id });
  } else {
    await supabase
      .from("presencas")
      .delete()
      .eq("encontro_id", id)
      .eq("perfil_id", perfil.id);
  }
  revalidatePath(`/mapa/${id}`);
  revalidatePath("/mapa");
}
