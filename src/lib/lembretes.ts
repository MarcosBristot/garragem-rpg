import "server-only";
import {
  encontrosProximos,
  lembreteDoCarro,
  ordenarLembretes,
  sequenciaDeMeses,
  type EncontroParaLembrete,
  type Lembrete,
  type Sequencia,
} from "@/dominio/lembretes";
import { nomeDoCarro } from "@/lib/carros";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { registrarFalha } from "@/lib/log";
import type { exigirPerfil } from "@/lib/sessao";

type Supabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

export type ResumoLembretes = {
  sequencia: Sequencia;
  carros: { id: string; nome: string; lembrete: Lembrete }[];
  encontros: EncontroParaLembrete[];
};

/**
 * Sequência e lembretes da pessoa. Filtro por dono obrigatório: a RLS também
 * libera carros públicos de outras pessoas. É um extra da tela: se falhar,
 * o painel some (vai ao log) e o feed continua funcionando.
 */
export async function carregarLembretes(
  supabase: Supabase,
  usuarioId: string,
): Promise<ResumoLembretes | null> {
  const campos = "id, titulo, local_nome, inicio, fim";
  const agora = new Date().toISOString();
  const [
    { data, error },
    { data: organizados, error: e2 },
    { data: presencas, error: e3 },
  ] = await Promise.all([
    supabase
      .from("carros")
      .select(
        "id, apelido, marca, modelo, registros(tipo, data, km, criado_em)",
      )
      .eq("dono_id", usuarioId)
      .order("criado_em"),
    supabase
      .from("encontros")
      .select(campos)
      .eq("organizador_id", usuarioId)
      .gt("fim", agora),
    // Encontro que a pessoa não pode mais ver (bloqueio) vem null: a RLS vale.
    supabase
      .from("presencas")
      .select(`encontros (${campos})`)
      .eq("perfil_id", usuarioId),
  ]);
  const falha = error ?? e2 ?? e3;
  if (falha || !data) {
    registrarFalha("lembretes: carregar", falha);
    return null;
  }

  const hoje = hojeEmSaoPaulo();
  const meses = data.flatMap((c) =>
    c.registros.map((r) => hojeEmSaoPaulo(new Date(r.criado_em)).slice(0, 7)),
  );
  const carros = data.flatMap((c) => {
    const lembrete = lembreteDoCarro(c.registros, hoje);
    return lembrete ? [{ id: c.id, nome: nomeDoCarro(c), lembrete }] : [];
  });
  return {
    sequencia: sequenciaDeMeses(meses, hoje),
    carros: ordenarLembretes(carros).slice(0, 3),
    encontros: encontrosProximos([
      ...(organizados ?? []),
      ...(presencas ?? []).flatMap((p) => (p.encontros ? [p.encontros] : [])),
    ]).slice(0, 3),
  };
}
