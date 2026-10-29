import { notFound } from "next/navigation";
import type { criarClienteServidor } from "./supabase/servidor";
import { ehUuid } from "./uuid";

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>;

/**
 * Carro do dono ou 404. O filtro por dono é obrigatório: a RLS também
 * libera carros públicos de outras pessoas.
 */
export async function carroDoDonoOu404(
  supabase: Cliente,
  donoId: string,
  carroId: string,
) {
  if (!ehUuid(carroId)) notFound();
  const { data: carro } = await supabase
    .from("carros")
    .select("id, marca, modelo, ano, apelido, publico, foto_capa")
    .eq("id", carroId)
    .eq("dono_id", donoId)
    .maybeSingle();
  if (!carro) notFound();
  return carro;
}

/** Nome para exibir: o apelido, se houver. */
export function nomeDoCarro(carro: {
  apelido: string | null;
  marca: string;
  modelo: string;
}): string {
  return carro.apelido ?? `${carro.marca} ${carro.modelo}`;
}
