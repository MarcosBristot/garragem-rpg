// Item de um registro: peça, mão de obra etc. Espelha `itens_registro`.
// Lembrete do CLAUDE.md: dinheiro gasto nunca gera pontos diretamente.

import { reaisParaCentavos } from "./dinheiro";

export const CATEGORIAS = {
  peca: "Peça",
  mao_de_obra: "Mão de obra",
  fluido: "Fluido ou consumível",
  acessorio: "Acessório",
  outro: "Outro",
} as const;

export const ESPACOS = {
  motor: "Motor",
  suspensao: "Suspensão",
  rodas: "Rodas",
  freios: "Freios",
  estetica: "Estética",
  som: "Som",
} as const;

export type Categoria = keyof typeof CATEGORIAS;
export type Espaco = keyof typeof ESPACOS;

export interface DadosItem {
  descricao: string;
  categoria: Categoria;
  quantidade: number;
  valorCentavos: number | null;
  espaco: Espaco | null;
}

export type ErrosItem = Partial<Record<keyof DadosItem, string>>;

export type ResultadoItem =
  { ok: true; dados: DadosItem } | { ok: false; erros: ErrosItem };

/** numeric(10,2) no banco: até 8 dígitos inteiros e 2 decimais. */
const QUANTIDADE = /^\d{1,8}(?:,\d{1,2})?$/;

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

export function validarItem(entrada: {
  descricao: unknown;
  categoria: unknown;
  quantidade: unknown;
  valor: unknown;
  espaco: unknown;
}): ResultadoItem {
  const descricao = texto(entrada.descricao);
  const categoria = texto(entrada.categoria);
  const quantidadeTexto = texto(entrada.quantidade) || "1";
  const valorCentavos = reaisParaCentavos(texto(entrada.valor));
  const espaco = texto(entrada.espaco);

  const erros: ErrosItem = {};
  if (descricao.length < 1 || descricao.length > 120) {
    erros.descricao = "Descreva o item (até 120 caracteres).";
  }
  if (!Object.hasOwn(CATEGORIAS, categoria)) {
    erros.categoria = "Escolha uma categoria.";
  }
  const quantidade = QUANTIDADE.test(quantidadeTexto)
    ? Number(quantidadeTexto.replace(",", "."))
    : NaN;
  if (!(quantidade > 0)) {
    erros.quantidade = "Use um número maior que zero (ex.: 1 ou 4,5).";
  }
  if (valorCentavos === undefined) {
    erros.valorCentavos = "Use o formato 180 ou 1.234,56.";
  }
  if (espaco !== "" && !Object.hasOwn(ESPACOS, espaco)) {
    erros.espaco = "Escolha um espaço da lista.";
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      descricao,
      categoria: categoria as Categoria,
      quantidade,
      valorCentavos: valorCentavos ?? null,
      espaco: espaco === "" ? null : (espaco as Espaco),
    },
  };
}

/** Soma dos valores informados; itens sem valor não entram. */
export function totalCentavos(
  itens: { valor_centavos: number | null }[],
): number {
  return itens.reduce((soma, item) => soma + (item.valor_centavos ?? 0), 0);
}
