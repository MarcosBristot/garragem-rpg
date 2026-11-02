// Conquistas do carro: derivadas dos dados, como nível e atributos (se a
// pessoa apaga o que deu a conquista, ela some; decisão do produto).
// Função pura sobre os totais de public.ficha_do_carro. Dinheiro nunca conta.

import type { Insumos } from "./atributos";
import { diasEntre } from "./condicao";
import { ESPACOS } from "./item";
import { nivelDoXp } from "./xp";

export type Grupo =
  "Diário" | "Mão na massa" | "Equipamento" | "Comunidade" | "RPG";

type Definicao = {
  id: string;
  nome: string;
  descricao: string;
  grupo: Grupo;
  alvo: number;
  /** Unidade do progresso, quando não é "vezes" (ex.: "dias"). */
  unidade?: string;
  /** Quanto já foi feito (na mesma unidade do alvo). */
  progresso: (i: Insumos) => number;
};

/** Dias entre o primeiro e o último registro. */
function diasDeDiario(i: Insumos): number {
  if (!i.primeiro_registro || !i.ultimo_registro) return 0;
  return Math.max(0, diasEntre(i.primeiro_registro, i.ultimo_registro));
}

export const CONQUISTAS: Definicao[] = [
  {
    id: "primeira_revisao",
    nome: "Primeira revisão",
    descricao: "Registrou a primeira manutenção.",
    grupo: "Diário",
    alvo: 1,
    progresso: (i) => i.manutencoes_total,
  },
  {
    id: "diario_em_dia",
    nome: "Diário em dia",
    descricao: "10 registros no diário.",
    grupo: "Diário",
    alvo: 10,
    progresso: (i) => i.registros_total,
  },
  {
    id: "historiador",
    nome: "Historiador",
    descricao: "50 registros no diário.",
    grupo: "Diário",
    alvo: 50,
    progresso: (i) => i.registros_total,
  },
  {
    id: "um_ano_de_estrada",
    nome: "Um ano de estrada",
    descricao: "Um ano entre o primeiro e o último registro.",
    grupo: "Diário",
    alvo: 365,
    unidade: "dias",
    progresso: diasDeDiario,
  },
  {
    id: "detalhista",
    nome: "Detalhista",
    descricao: "10 registros completos (km e item ou foto).",
    grupo: "Diário",
    alvo: 10,
    progresso: (i) => i.completos_total,
  },
  {
    id: "mao_na_graxa",
    nome: "Mão na graxa",
    descricao: 'Primeiro "fiz eu mesmo" com foto ou item.',
    grupo: "Mão na massa",
    alvo: 1,
    progresso: (i) => i.diy_com_prova,
  },
  {
    id: "garimpeiro",
    nome: "Garimpeiro",
    descricao: "5 peças reaproveitadas ou usadas.",
    grupo: "Mão na massa",
    alvo: 5,
    progresso: (i) => i.reaproveitadas,
  },
  {
    id: "envenenado",
    nome: "Envenenado",
    descricao: "3 modificações com peça no motor.",
    grupo: "Mão na massa",
    alvo: 3,
    progresso: (i) => i.mods_motor,
  },
  {
    id: "montado",
    nome: "Montado",
    descricao: "Peça em todos os espaços de equipamento.",
    grupo: "Equipamento",
    alvo: Object.keys(ESPACOS).length,
    progresso: (i) => i.espacos_ocupados,
  },
  {
    id: "na_vitrine",
    nome: "Na vitrine",
    descricao: "Primeiro post no feed.",
    grupo: "Comunidade",
    alvo: 1,
    progresso: (i) => i.posts_total,
  },
  {
    id: "curtido",
    nome: "Curtido",
    descricao: "10 pessoas diferentes curtiram os posts do carro.",
    grupo: "Comunidade",
    alvo: 10,
    progresso: (i) => i.curtidores,
  },
  {
    id: "veterano",
    nome: "Veterano",
    descricao: "Chegou ao nível 5.",
    grupo: "RPG",
    alvo: 5,
    progresso: (i) => nivelDoXp(i.xp),
  },
];

export type Conquista = {
  id: string;
  nome: string;
  descricao: string;
  grupo: Grupo;
  unidade?: string;
  desbloqueada: boolean;
  /** Progresso já limitado ao alvo (ex.: 7 de 10). */
  atual: number;
  alvo: number;
};

export function avaliarConquistas(insumos: Insumos): Conquista[] {
  return CONQUISTAS.map(({ progresso, ...c }) => {
    const bruto = progresso(insumos);
    const atual = Math.min(c.alvo, Math.max(0, Math.floor(bruto) || 0));
    return { ...c, atual, desbloqueada: atual >= c.alvo };
  });
}
