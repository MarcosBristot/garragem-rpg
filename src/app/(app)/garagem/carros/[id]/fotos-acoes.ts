"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apagarFoto, enviarFoto } from "@/lib/fotos/armazenamento";
import { chaveCapa, chaveFotoRegistro } from "@/lib/fotos/chaves";
import { prepararFoto } from "@/lib/fotos/preparar";
import { usuarioLogado } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

type Resultado = { erro?: string };

const NAO_ENCONTRADO = { erro: "Não encontrado." };
const FALHA = { erro: "Não foi possível enviar a foto. Tente de novo." };

// ---------------------------------------------------------------- capa

export async function enviarCapa(
  carroId: string,
  form: FormData,
): Promise<Resultado> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (!ehUuid(carroId)) return NAO_ENCONTRADO;

  const { data: carro } = await supabase
    .from("carros")
    .select("id, foto_capa")
    .eq("id", carroId)
    .eq("dono_id", usuarioId)
    .maybeSingle();
  if (!carro) return NAO_ENCONTRADO;

  const preparada = await prepararFoto(form);
  if (!preparada.ok) return { erro: preparada.erro };

  const chave = chaveCapa(usuarioId, carroId, crypto.randomUUID());
  try {
    await enviarFoto(chave, preparada.foto.arquivos);
  } catch {
    return FALHA;
  }

  const { error } = await supabase
    .from("carros")
    .update({ foto_capa: chave })
    .eq("id", carroId)
    .eq("dono_id", usuarioId);
  if (error) {
    await apagarFoto(chave).catch(() => undefined);
    return FALHA;
  }
  // A capa antiga não serve mais: apaga para não deixar arquivo órfão.
  if (carro.foto_capa) await apagarFoto(carro.foto_capa).catch(() => undefined);

  revalidatePath(`/garagem/carros/${carroId}`);
  revalidatePath("/garagem");
  return {};
}

export async function removerCapa(carroId: string): Promise<void> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (!ehUuid(carroId)) return;

  const { data: carro } = await supabase
    .from("carros")
    .select("foto_capa")
    .eq("id", carroId)
    .eq("dono_id", usuarioId)
    .maybeSingle();
  if (!carro?.foto_capa) return;

  await apagarFoto(carro.foto_capa);
  await supabase
    .from("carros")
    .update({ foto_capa: null })
    .eq("id", carroId)
    .eq("dono_id", usuarioId);
  revalidatePath(`/garagem/carros/${carroId}`);
  revalidatePath("/garagem");
}

// ---------------------------------------------------- fotos do registro

export async function adicionarFotoRegistro(
  carroId: string,
  registroId: string,
  form: FormData,
): Promise<Resultado> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (!ehUuid(carroId) || !ehUuid(registroId)) return NAO_ENCONTRADO;

  const { data: registro } = await supabase
    .from("registros")
    .select("id, fotos_registro(count)")
    .eq("id", registroId)
    .eq("carro_id", carroId)
    .eq("dono_id", usuarioId)
    .maybeSingle();
  if (!registro) return NAO_ENCONTRADO;
  // Checagem amigável; o banco também barra a 7ª foto (trigger).
  if ((registro.fotos_registro[0]?.count ?? 0) >= 6) {
    return { erro: "Este registro já tem 6 fotos." };
  }

  const preparada = await prepararFoto(form);
  if (!preparada.ok) return { erro: preparada.erro };
  const descricao = String(form.get("descricao") ?? "")
    .trim()
    .slice(0, 200);

  const chave = chaveFotoRegistro(
    usuarioId,
    carroId,
    registroId,
    crypto.randomUUID(),
  );
  try {
    await enviarFoto(chave, preparada.foto.arquivos);
  } catch {
    return FALHA;
  }

  const { error } = await supabase.from("fotos_registro").insert({
    registro_id: registroId,
    chave,
    descricao: descricao || null,
    largura: preparada.foto.largura,
    altura: preparada.foto.altura,
  });
  if (error) {
    // Linha não entrou: apaga o arquivo para não ficar órfão.
    await apagarFoto(chave).catch(() => undefined);
    return error.code === "23514"
      ? { erro: "Este registro já tem 6 fotos." }
      : FALHA;
  }

  revalidatePath(`/garagem/carros/${carroId}/registros/${registroId}/editar`);
  revalidatePath(`/garagem/carros/${carroId}`);
  return {};
}

export async function removerFotoRegistro(
  carroId: string,
  registroId: string,
  fotoId: string,
): Promise<void> {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (!ehUuid(fotoId)) return;

  const { data: foto } = await supabase
    .from("fotos_registro")
    .delete()
    .eq("id", fotoId)
    .eq("dono_id", usuarioId)
    .select("chave")
    .maybeSingle();
  if (foto) await apagarFoto(foto.chave);

  revalidatePath(`/garagem/carros/${carroId}/registros/${registroId}/editar`);
  revalidatePath(`/garagem/carros/${carroId}`);
}
