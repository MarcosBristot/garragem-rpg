"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarOS, type ErrosOS } from "@/dominio/ordem-servico";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { apagarFoto, enviarFoto } from "@/lib/fotos/armazenamento";
import { chaveFotoOS } from "@/lib/fotos/chaves";
import { prepararFoto } from "@/lib/fotos/preparar";
import { usuarioLogado } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";

// Ordem de serviço: documento sempre privado (pode ter CPF/endereço).
// Nada daqui vai para log nem para páginas públicas.

export type EstadoOS = {
  valores: Record<"oficina" | "data" | "km" | "total", string>;
  erros: ErrosOS;
  erroGeral?: string;
  salvo?: boolean;
};

function revalidar(carroId: string, registroId: string) {
  revalidatePath(`/garagem/carros/${carroId}/registros/${registroId}/editar`);
}

/** O registro é do usuário? (a RLS também barra, isto dá a mensagem certa) */
async function registroDoDono(carroId: string, registroId: string) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) redirect("/entrar");
  if (!ehUuid(carroId) || !ehUuid(registroId)) return null;
  const { data } = await supabase
    .from("registros")
    .select("id, ordens_servico(foto_chave)")
    .eq("id", registroId)
    .eq("carro_id", carroId)
    .eq("dono_id", usuarioId)
    .maybeSingle();
  if (!data) return null;
  return {
    supabase,
    usuarioId,
    fotoAtual: data.ordens_servico?.foto_chave ?? null,
  };
}

export async function salvarOS(
  carroId: string,
  registroId: string,
  _estado: EstadoOS,
  form: FormData,
): Promise<EstadoOS> {
  const valores = {
    oficina: String(form.get("oficina") ?? ""),
    data: String(form.get("data") ?? ""),
    km: String(form.get("km") ?? ""),
    total: String(form.get("total") ?? ""),
  };
  const contexto = await registroDoDono(carroId, registroId);
  if (!contexto) {
    return { valores, erros: {}, erroGeral: "Registro não encontrado." };
  }
  const r = validarOS(valores, hojeEmSaoPaulo());
  if (!r.ok) return { valores, erros: r.erros };

  const { error } = await contexto.supabase.from("ordens_servico").upsert(
    {
      registro_id: registroId,
      oficina: r.dados.oficina,
      data: r.dados.data,
      km: r.dados.km,
      total_centavos: r.dados.totalCentavos,
    },
    { onConflict: "registro_id" },
  );
  if (error) {
    return {
      valores,
      erros: {},
      erroGeral: "Não foi possível salvar. Tente de novo.",
    };
  }
  revalidar(carroId, registroId);
  return { valores, erros: {}, salvo: true };
}

export async function enviarFotoOS(
  carroId: string,
  registroId: string,
  form: FormData,
): Promise<{ erro?: string }> {
  const contexto = await registroDoDono(carroId, registroId);
  if (!contexto) return { erro: "Registro não encontrado." };

  const preparada = await prepararFoto(form);
  if (!preparada.ok) return { erro: preparada.erro };

  const chave = chaveFotoOS(
    contexto.usuarioId,
    carroId,
    registroId,
    crypto.randomUUID(),
  );
  try {
    await enviarFoto(chave, preparada.foto.arquivos);
  } catch {
    return { erro: "Não foi possível enviar a foto. Tente de novo." };
  }
  const { error } = await contexto.supabase
    .from("ordens_servico")
    .upsert(
      { registro_id: registroId, foto_chave: chave },
      { onConflict: "registro_id" },
    );
  if (error) {
    await apagarFoto(chave).catch(() => undefined);
    return { erro: "Não foi possível enviar a foto. Tente de novo." };
  }
  if (contexto.fotoAtual)
    await apagarFoto(contexto.fotoAtual).catch(() => undefined);
  revalidar(carroId, registroId);
  return {};
}

export async function removerOS(carroId: string, registroId: string) {
  const contexto = await registroDoDono(carroId, registroId);
  if (!contexto) return;
  // Arquivo antes da linha: se falhar, nada some pela metade.
  if (contexto.fotoAtual) await apagarFoto(contexto.fotoAtual);
  await contexto.supabase
    .from("ordens_servico")
    .delete()
    .eq("registro_id", registroId);
  revalidar(carroId, registroId);
}
