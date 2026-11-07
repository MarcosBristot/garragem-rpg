"use server";

import { revalidatePath } from "next/cache";
import { apagarFoto, enviarFoto } from "@/lib/fotos/armazenamento";
import { chaveFotoPerfil } from "@/lib/fotos/chaves";
import { prepararFoto } from "@/lib/fotos/preparar";
import { registrarFalha } from "@/lib/log";
import { exigirPerfil } from "@/lib/sessao";

// Foto de perfil. Mesmo caminho das outras fotos: o servidor reprocessa
// (sai EXIF/GPS), guarda 3 tamanhos e o banco fica só com a chave.

const FALHA = { erro: "Não foi possível enviar a foto. Tente de novo." };

function revalidar(nomeUsuario: string) {
  revalidatePath("/conta", "layout");
  revalidatePath("/feed");
  revalidatePath("/garagem");
  revalidatePath(`/u/${nomeUsuario}`);
}

export async function enviarFotoPerfil(
  form: FormData,
): Promise<{ erro?: string }> {
  const { supabase, perfil } = await exigirPerfil({ aceiteOpcional: true });

  const preparada = await prepararFoto(form);
  if (!preparada.ok) return { erro: preparada.erro };

  const chave = chaveFotoPerfil(perfil.id, crypto.randomUUID());
  try {
    await enviarFoto(chave, preparada.foto.arquivos);
  } catch (erro) {
    registrarFalha("perfil: enviar foto ao armazenamento", erro);
    return FALHA;
  }

  const { error } = await supabase
    .from("perfis")
    .update({ foto: chave })
    .eq("id", perfil.id);
  if (error) {
    await apagarFoto(chave).catch(() => undefined);
    registrarFalha("perfil: gravar foto no banco", error);
    return FALHA;
  }
  // A foto antiga não serve mais: apaga para não deixar arquivo órfão.
  if (perfil.foto) await apagarFoto(perfil.foto).catch(() => undefined);

  revalidar(perfil.nome_usuario);
  return {};
}

export async function removerFotoPerfil(): Promise<void> {
  const { supabase, perfil } = await exigirPerfil({ aceiteOpcional: true });
  if (!perfil.foto) return;
  const { error } = await supabase
    .from("perfis")
    .update({ foto: null })
    .eq("id", perfil.id);
  if (error) {
    registrarFalha("perfil: remover foto", error);
    return;
  }
  await apagarFoto(perfil.foto).catch(() => undefined);
  revalidar(perfil.nome_usuario);
}
