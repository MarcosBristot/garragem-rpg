"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarItem, type ErrosItem } from "@/dominio/item";
import { usuarioLogado } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { VALORES_ITEM_VAZIOS, type ValoresItem } from "./valores";

export type EstadoItem = {
  valores: ValoresItem;
  erros: ErrosItem;
  erroGeral?: string;
  /**
   * Muda a cada resposta: o formulário usa como `key` e é recriado com os
   * valores certos. Sem isso, o reset do React 19 volta os <select> ao
   * padrão (ele não marca o atributo `selected`).
   */
  versao: number;
};

function caminhos(carroId: string, registroId: string) {
  revalidatePath(`/garagem/carros/${carroId}/registros/${registroId}/editar`);
  revalidatePath(`/garagem/carros/${carroId}`);
}

export async function adicionarItem(
  carroId: string,
  registroId: string,
  estado: EstadoItem,
  form: FormData,
): Promise<EstadoItem> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  const valores: ValoresItem = {
    descricao: String(form.get("descricao") ?? ""),
    categoria: String(form.get("categoria") ?? ""),
    quantidade: String(form.get("quantidade") ?? ""),
    valor: String(form.get("valor") ?? ""),
    espaco: String(form.get("espaco") ?? ""),
  };
  const resultado = validarItem(valores);
  if (!resultado.ok) {
    return { valores, erros: resultado.erros, versao: estado.versao + 1 };
  }
  if (!ehUuid(carroId) || !ehUuid(registroId)) {
    return {
      valores,
      erros: {},
      erroGeral: "Registro não encontrado.",
      versao: estado.versao + 1,
    };
  }

  // A RLS só deixa inserir em registro do próprio usuário.
  const d = resultado.dados;
  const { error } = await supabase.from("itens_registro").insert({
    registro_id: registroId,
    descricao: d.descricao,
    categoria: d.categoria,
    quantidade: d.quantidade,
    valor_centavos: d.valorCentavos,
    espaco: d.espaco,
  });
  if (error) {
    return {
      valores,
      erros: {},
      erroGeral:
        error.code === "42501"
          ? "Registro não encontrado."
          : "Não foi possível salvar. Tente de novo.",
      versao: estado.versao + 1,
    };
  }

  caminhos(carroId, registroId);
  return { valores: VALORES_ITEM_VAZIOS, erros: {}, versao: estado.versao + 1 };
}

export async function removerItem(
  carroId: string,
  registroId: string,
  itemId: string,
) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");

  if (ehUuid(itemId) && ehUuid(registroId)) {
    // O trigger guarda o item removido no histórico do registro.
    await supabase
      .from("itens_registro")
      .delete()
      .eq("id", itemId)
      .eq("registro_id", registroId);
  }
  caminhos(carroId, registroId);
}
