"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarCarro, type ErrosCarro } from "@/dominio/carro";
import { usuarioLogado } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

export type ValoresCarro = {
  marca: string;
  modelo: string;
  ano: string;
  apelido: string;
  publico: boolean;
};

export type EstadoCarro = {
  valores: ValoresCarro;
  erros: ErrosCarro;
  erroGeral?: string;
};

// Server Actions podem ser chamadas por qualquer POST, não só pela tela:
// cada uma confere a sessão. A RLS é a segunda barreira.

/** Cria (id null) ou edita o carro. O id vem de .bind() na página. */
export async function salvarCarro(
  id: string | null,
  _estado: EstadoCarro,
  form: FormData,
): Promise<EstadoCarro> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const valores: ValoresCarro = {
    marca: String(form.get("marca") ?? ""),
    modelo: String(form.get("modelo") ?? ""),
    ano: String(form.get("ano") ?? ""),
    apelido: String(form.get("apelido") ?? ""),
    publico: form.get("publico") === "on",
  };
  const resultado = validarCarro(valores, new Date().getFullYear());
  if (!resultado.ok) return { valores, erros: resultado.erros };

  const linha = resultado.dados;
  const { data, error } =
    id === null
      ? await supabase
          .from("carros")
          .insert({ ...linha, dono_id: usuarioId })
          .select("id")
      : ehUuid(id)
        ? await supabase
            .from("carros")
            .update(linha)
            .eq("id", id)
            .eq("dono_id", usuarioId)
            .select("id")
        : { data: [], error: null };

  if (error) {
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
    };
  }
  // Update sem linha afetada: carro não existe ou é de outra pessoa.
  if (data.length === 0) {
    return { valores, erros: {}, erroGeral: "Carro não encontrado." };
  }

  revalidatePath("/garagem");
  redirect("/garagem");
}

export async function apagarCarro(id: string) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  if (ehUuid(id)) {
    // Registros, itens e histórico do carro vão junto (ON DELETE CASCADE).
    await supabase
      .from("carros")
      .delete()
      .eq("id", id)
      .eq("dono_id", usuarioId);
  }
  revalidatePath("/garagem");
  redirect("/garagem");
}
