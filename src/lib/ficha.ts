import "server-only";
import {
  calcularAtributos,
  lerInsumos,
  type Atributos,
} from "@/dominio/atributos";
import { avaliarConquistas, type Conquista } from "@/dominio/conquistas";
import { progressoXp, type Progresso } from "@/dominio/xp";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hojeEmSaoPaulo } from "@/lib/datas";
import type { Database } from "@/lib/supabase/tipos";

// Ficha RPG do carro: o banco entrega só totais (public.ficha_do_carro, que
// responde apenas para carro público ou para o dono) e o cálculo acontece
// aqui, no servidor (regra 4), com as funções puras de src/dominio.

// Serve com sessão (página do dono) e sem (página pública, anônima).
type Cliente = SupabaseClient<Database>;

export type Ficha = {
  atributos: Atributos;
  progresso: Progresso;
  conquistas: Conquista[];
};

export async function fichaDoCarro(
  supabase: Cliente,
  carroId: string,
): Promise<Ficha | null> {
  const { data, error } = await supabase.rpc("ficha_do_carro", {
    p_carro: carroId,
  });
  if (error) throw new Error(`Ficha: ${error.code} ${error.message}`);
  const insumos = lerInsumos(data);
  if (!insumos) return null;
  return {
    atributos: calcularAtributos(insumos, hojeEmSaoPaulo()),
    progresso: progressoXp(insumos.xp),
    conquistas: avaliarConquistas(insumos),
  };
}
