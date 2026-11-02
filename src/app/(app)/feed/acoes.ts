"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { limparDescricao, MAX_FOTOS_POST, validarPost } from "@/dominio/post";
import {
  apagarFoto,
  apagarPrefixo,
  enviarFoto,
} from "@/lib/fotos/armazenamento";
import { chaveFotoPost, prefixoPost } from "@/lib/fotos/chaves";
import { prepararFoto } from "@/lib/fotos/preparar";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

// A Vercel limita cada requisição a 4,5 MB: o post nasce com a 1ª foto
// (criarPost) e as outras sobem uma por vez (adicionarFotoPost).

export type ResultadoCriarPost =
  | { ok: true; postId: string }
  | { ok: false; erro: string; erros?: { carro?: string; legenda?: string } };

const FALHA = "Não foi possível publicar. Tente de novo.";

type Supabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

/** Processa (sem EXIF/GPS), envia ao armazenamento e grava a linha. */
async function salvarFoto(
  supabase: Supabase,
  donoId: string,
  carroId: string,
  postId: string,
  form: FormData,
): Promise<string | null> {
  const preparada = await prepararFoto(form);
  if (!preparada.ok) return preparada.erro;

  const chave = chaveFotoPost(donoId, carroId, postId, crypto.randomUUID());
  try {
    await enviarFoto(chave, preparada.foto.arquivos);
  } catch {
    return FALHA;
  }
  const { error } = await supabase.from("fotos_post").insert({
    post_id: postId,
    chave,
    descricao: limparDescricao(form.get("descricao")),
    largura: preparada.foto.largura,
    altura: preparada.foto.altura,
  });
  if (error) {
    await apagarFoto(chave).catch(() => undefined);
    return error.code === "23514"
      ? `No máximo ${MAX_FOTOS_POST} fotos por post.`
      : FALHA;
  }
  return null;
}

export async function criarPost(form: FormData): Promise<ResultadoCriarPost> {
  const { supabase, perfil } = await exigirPerfil();
  const validado = validarPost({
    carroId: form.get("carro"),
    legenda: form.get("legenda"),
  });
  if (!validado.ok) {
    return { ok: false, erro: "Confira os campos.", erros: validado.erros };
  }
  const { carroId, legenda } = validado.dados;

  // A RLS só aceita carro próprio e público; aqui só damos a mensagem certa.
  const { data: post, error } = await supabase
    .from("posts")
    .insert({ carro_id: carroId, legenda })
    .select("id")
    .single();
  if (error?.code === "23514") {
    return { ok: false, erro: "Você chegou ao limite de posts de hoje." };
  }
  if (error || !post) {
    return {
      ok: false,
      erro: "Só dá para publicar fotos de um carro seu marcado como público.",
    };
  }

  const erroFoto = await salvarFoto(
    supabase,
    perfil.id,
    carroId,
    post.id,
    form,
  );
  if (erroFoto) {
    // Post sem foto não aparece no feed: desfaz para não deixar lixo.
    await supabase.from("posts").delete().eq("id", post.id);
    return { ok: false, erro: erroFoto };
  }

  revalidatePath("/feed");
  return { ok: true, postId: post.id };
}

export async function adicionarFotoPost(
  postId: string,
  form: FormData,
): Promise<{ erro?: string }> {
  const { supabase, perfil } = await exigirPerfil();
  if (!ehUuid(postId)) return { erro: "Post não encontrado." };

  const { data: post } = await supabase
    .from("posts")
    .select("id, carro_id")
    .eq("id", postId)
    .eq("dono_id", perfil.id)
    .maybeSingle();
  if (!post) return { erro: "Post não encontrado." };

  const erro = await salvarFoto(
    supabase,
    perfil.id,
    post.carro_id,
    post.id,
    form,
  );
  revalidatePath("/feed");
  return erro ? { erro } : {};
}

export async function excluirPost(postId: string): Promise<void> {
  const { supabase, perfil } = await exigirPerfil();
  if (!ehUuid(postId)) return;

  const { data: post } = await supabase
    .from("posts")
    .select("id, carro_id")
    .eq("id", postId)
    .eq("dono_id", perfil.id)
    .maybeSingle();
  if (!post) return;

  // Arquivos primeiro: se falhar, o post continua e dá para tentar de novo.
  await apagarPrefixo(prefixoPost(perfil.id, post.carro_id, post.id));
  await supabase.from("posts").delete().eq("id", post.id);
  revalidatePath("/feed");
  redirect("/feed");
}
