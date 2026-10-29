"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarRegistro, type ErrosRegistro } from "@/dominio/registro";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { usuarioLogado } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

export type ValoresRegistro = Record<
  "tipo" | "titulo" | "data" | "km" | "notas" | "visibilidade",
  string
>;

export type EstadoRegistro = {
  valores: ValoresRegistro;
  erros: ErrosRegistro;
  erroGeral?: string;
};

/** Cria (registroId null) ou edita. Os ids vêm de .bind() na página. */
export async function salvarRegistro(
  carroId: string,
  registroId: string | null,
  _estado: EstadoRegistro,
  form: FormData,
): Promise<EstadoRegistro> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const valores: ValoresRegistro = {
    tipo: String(form.get("tipo") ?? ""),
    titulo: String(form.get("titulo") ?? ""),
    data: String(form.get("data") ?? ""),
    km: String(form.get("km") ?? ""),
    notas: String(form.get("notas") ?? ""),
    visibilidade: String(form.get("visibilidade") ?? ""),
  };
  const resultado = validarRegistro(valores, hojeEmSaoPaulo());
  if (!resultado.ok) return { valores, erros: resultado.erros };

  const naoEncontrado = {
    valores,
    erros: {},
    erroGeral: "Registro não encontrado.",
  };
  if (!ehUuid(carroId) || (registroId !== null && !ehUuid(registroId))) {
    return naoEncontrado;
  }

  // Na criação, a FK composta (carro_id, dono_id) recusa carro alheio.
  const { data, error } =
    registroId === null
      ? await supabase
          .from("registros")
          .insert({ ...resultado.dados, carro_id: carroId, dono_id: usuarioId })
          .select("id")
      : await supabase
          .from("registros")
          .update(resultado.dados)
          .eq("id", registroId)
          .eq("carro_id", carroId)
          .eq("dono_id", usuarioId)
          .select("id");

  if (error?.code === "23503") return naoEncontrado;
  if (error) {
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
    };
  }
  if (data.length === 0) return naoEncontrado;

  revalidatePath(`/garagem/carros/${carroId}`);
  // Registro novo: segue para a tela dele, direto na parte de itens.
  redirect(
    registroId === null
      ? `/garagem/carros/${carroId}/registros/${data[0].id}/editar#itens`
      : `/garagem/carros/${carroId}`,
  );
}

export async function apagarRegistro(carroId: string, registroId: string) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  if (ehUuid(carroId) && ehUuid(registroId)) {
    await supabase
      .from("registros")
      .delete()
      .eq("id", registroId)
      .eq("carro_id", carroId)
      .eq("dono_id", usuarioId);
  }
  revalidatePath(`/garagem/carros/${carroId}`);
  redirect(`/garagem/carros/${carroId}`);
}
