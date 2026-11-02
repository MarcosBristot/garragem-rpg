// Equipamento do carro: um "espaço" por área (motor, suspensão, rodas,
// freios, estética, som), como os slots de um personagem de RPG.
// Derivado dos itens que a pessoa já marca com "Espaço": a peça mais
// recente de cada espaço é a que está "equipada". Nada novo é guardado.
// Função pura: quem chama decide quais registros entram (todos, na página
// do dono; só os públicos, na ficha pública).

import { ESPACOS, type Espaco } from "./item";

export type ItemComEspaco = {
  descricao: string | null;
  espaco: string | null;
  /** Desempate entre itens do mesmo registro (o adicionado por último vence). */
  criado_em?: string | null;
};

export type RegistroComItens = {
  data: string | null; // AAAA-MM-DD
  itens: ItemComEspaco[];
};

export type EspacoEquipado = {
  /** Peça equipada (a mais recente), ou null se o espaço está vazio. */
  atual: { descricao: string; data: string } | null;
  /** Quantas peças já passaram por este espaço. */
  total: number;
};

export type Equipamento = Record<Espaco, EspacoEquipado>;

export function montarEquipamento(registros: RegistroComItens[]): Equipamento {
  const equipamento = Object.fromEntries(
    Object.keys(ESPACOS).map((e) => [e, { atual: null, total: 0 }]),
  ) as Equipamento;
  const ordemDoAtual = {} as Record<Espaco, string>;

  for (const registro of registros) {
    if (!registro.data) continue;
    for (const item of registro.itens) {
      const espaco = item.espaco ?? "";
      const descricao = item.descricao?.trim();
      if (!Object.hasOwn(ESPACOS, espaco) || !descricao) continue;
      const slot = equipamento[espaco as Espaco];
      slot.total += 1;
      // Ordena por data do registro e, no mesmo dia, pela criação do item.
      // AAAA-MM-DD e ISO comparam certo como texto.
      const ordem = `${registro.data}|${item.criado_em ?? ""}`;
      if (!slot.atual || ordem > ordemDoAtual[espaco as Espaco]) {
        slot.atual = { descricao, data: registro.data };
        ordemDoAtual[espaco as Espaco] = ordem;
      }
    }
  }
  return equipamento;
}

/** Quantos espaços têm alguma peça (para o resumo "4 de 6"). */
export function espacosOcupados(equipamento: Equipamento): number {
  return Object.values(equipamento).filter((s) => s.atual).length;
}
