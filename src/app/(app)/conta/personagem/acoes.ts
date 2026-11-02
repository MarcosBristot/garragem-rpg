"use server";

import { revalidatePath } from "next/cache";
import { CAMPOS, validarPersonagem } from "@/dominio/personagem";
import { exigirPerfil } from "@/lib/sessao";

export type EstadoPersonagem = {
  versao: number;
  erro?: string;
  salvo?: boolean;
};

export async function salvarPersonagem(
  estado: EstadoPersonagem,
  form: FormData,
): Promise<EstadoPersonagem> {
  const { supabase, perfil } = await exigirPerfil();
  const versao = estado.versao + 1;

  // Só os campos conhecidos, cada um conferido contra a lista de opções.
  const personagem = validarPersonagem(
    Object.fromEntries(Object.keys(CAMPOS).map((c) => [c, form.get(c)])),
  );
  if (!personagem) return { versao, erro: "Escolha uma opção em cada item." };

  const { error } = await supabase
    .from("perfis")
    .update({ personagem })
    .eq("id", perfil.id);
  if (error) return { versao, erro: "Não foi possível salvar. Tente de novo." };

  revalidatePath("/conta");
  revalidatePath(`/u/${perfil.nome_usuario}`);
  return { versao, salvo: true };
}
