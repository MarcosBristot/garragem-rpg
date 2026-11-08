// Sequência de meses e lembretes de manutenção: o que traz a pessoa de
// volta para cuidar do carro. Funções puras; "hoje" entra como parâmetro.
// Nada aqui dá XP (a sequência é só incentivo).

import { calcularCondicao, type RegistroParaCondicao } from "./condicao";

/** Abaixo disto, a revisão está perto de vencer (≈ 80% do intervalo). */
export const CONDICAO_ATENCAO = 60;
/** 50 = intervalo vencido (ver condicao.ts). */
export const CONDICAO_VENCIDA = 50;
/** Faltando estes dias para o mês acabar, a sequência entra em risco. */
export const DIAS_PARA_RISCO = 10;

export type Sequencia = {
  /** Meses seguidos com registro, terminando neste mês ou no anterior. */
  meses: number;
  registrouEsteMes: boolean;
  /** Dias até o fim deste mês. */
  diasRestantes: number;
  /** Há sequência, falta registrar neste mês e o mês está acabando. */
  emRisco: boolean;
};

function mesAnterior(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  return m === 1 ? `${ano - 1}-12` : `${ano}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * `mesesComRegistro`: "AAAA-MM" em que a pessoa CRIOU registros (não a data
 * informada no registro: preencher o passado não fabrica sequência).
 * O mês atual ainda em aberto não quebra a sequência.
 */
export function sequenciaDeMeses(
  mesesComRegistro: readonly string[],
  hoje: string,
): Sequencia {
  const meses = new Set(mesesComRegistro);
  const atual = hoje.slice(0, 7);
  const registrouEsteMes = meses.has(atual);
  let cursor = registrouEsteMes ? atual : mesAnterior(atual);
  let total = 0;
  while (meses.has(cursor)) {
    total++;
    cursor = mesAnterior(cursor);
  }
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const diasRestantes = ultimoDia - dia;
  return {
    meses: total,
    registrouEsteMes,
    diasRestantes,
    emRisco: total > 0 && !registrouEsteMes && diasRestantes <= DIAS_PARA_RISCO,
  };
}

export type Lembrete = {
  tipo: "vencida" | "atencao" | "sem_manutencao";
  /** null quando ainda não há manutenção para calcular. */
  condicao: number | null;
};

/** O que dizer sobre um carro; null quando ele está em dia. */
export function lembreteDoCarro(
  registros: RegistroParaCondicao[],
  hoje: string,
): Lembrete | null {
  const condicao = calcularCondicao(registros, hoje);
  if (!condicao) return { tipo: "sem_manutencao", condicao: null };
  if (condicao.valor <= CONDICAO_VENCIDA) {
    return { tipo: "vencida", condicao: condicao.valor };
  }
  if (condicao.valor <= CONDICAO_ATENCAO) {
    return { tipo: "atencao", condicao: condicao.valor };
  }
  return null;
}

/** Os mais urgentes primeiro; quem não tem manutenção fica por último. */
export function ordenarLembretes<T extends { lembrete: Lembrete }>(
  itens: readonly T[],
): T[] {
  const peso = (l: Lembrete) => l.condicao ?? 101;
  return [...itens].sort((a, b) => peso(a.lembrete) - peso(b.lembrete));
}

export type EncontroParaLembrete = {
  id: string;
  titulo: string;
  local_nome: string;
  inicio: string;
  fim: string;
};

/** Janela do aviso "encontro chegando". */
export const HORAS_ENCONTRO_PROXIMO = 48;

/**
 * Encontros que ainda não terminaram e começam dentro da janela, do mais
 * próximo para o mais distante, sem repetir (organizo e também confirmei).
 */
export function encontrosProximos(
  encontros: readonly EncontroParaLembrete[],
  agora: Date = new Date(),
): EncontroParaLembrete[] {
  const limite = agora.getTime() + HORAS_ENCONTRO_PROXIMO * 3_600_000;
  const unicos = new Map(encontros.map((e) => [e.id, e]));
  return [...unicos.values()]
    .filter(
      (e) =>
        Date.parse(e.fim) > agora.getTime() && Date.parse(e.inicio) <= limite,
    )
    .sort((a, b) => Date.parse(a.inicio) - Date.parse(b.inicio));
}
