// Validação de um registro do diário, espelhando os CHECKs de `registros`.
// Função pura: "hoje" entra como parâmetro (AAAA-MM-DD) para o teste não
// depender do relógio.

import { VISIBILIDADE_PADRAO, type Visibilidade } from "./visibilidade";

export type TipoRegistro = "manutencao" | "modificacao";

export const TIPOS: Record<TipoRegistro, string> = {
  manutencao: "Manutenção",
  modificacao: "Modificação",
};

export const VISIBILIDADES: Record<
  Visibilidade,
  { rotulo: string; descricao: string }
> = {
  privado: { rotulo: "Privado", descricao: "Só você vê." },
  publico_sem_valor: {
    rotulo: "Público sem valores",
    descricao: "Todos veem o registro, mas não quanto custou.",
  },
  publico: {
    rotulo: "Público",
    descricao: "Todos veem o registro e os valores.",
  },
};

export interface DadosRegistro {
  tipo: TipoRegistro;
  titulo: string;
  data: string;
  km: number | null;
  notas: string | null;
  visibilidade: Visibilidade;
}

export type ErrosRegistro = Partial<Record<keyof DadosRegistro, string>>;

export type ResultadoRegistro =
  { ok: true; dados: DadosRegistro } | { ok: false; erros: ErrosRegistro };

const KM_MAXIMO = 9_999_999;

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

/** Data real no formato AAAA-MM-DD (recusa 2026-02-30, por exemplo). */
function ehDataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    d.getUTCFullYear() === ano &&
    d.getUTCMonth() === mes - 1 &&
    d.getUTCDate() === dia
  );
}

export function validarRegistro(
  entrada: {
    tipo: unknown;
    titulo: unknown;
    data: unknown;
    km: unknown;
    notas: unknown;
    visibilidade: unknown;
  },
  hoje: string,
): ResultadoRegistro {
  // Pontos e espaços são aceitos no km ("120.500"), comuns no Brasil.
  const kmTexto = texto(entrada.km).replace(/[.\s]/g, "");
  const visibilidade = texto(entrada.visibilidade) || VISIBILIDADE_PADRAO;
  const dados = {
    tipo: texto(entrada.tipo),
    titulo: texto(entrada.titulo),
    data: texto(entrada.data),
    km: kmTexto === "" ? null : Number(kmTexto),
    notas: texto(entrada.notas) || null,
    visibilidade,
  };

  const erros: ErrosRegistro = {};
  if (!Object.hasOwn(TIPOS, dados.tipo)) {
    erros.tipo = "Escolha manutenção ou modificação.";
  }
  if (dados.titulo.length < 1 || dados.titulo.length > 120) {
    erros.titulo = "Informe um título (até 120 caracteres).";
  }
  if (!ehDataValida(dados.data)) {
    erros.data = "Informe uma data válida.";
  } else if (dados.data > hoje) {
    // Comparar AAAA-MM-DD como texto funciona: a ordem é a mesma.
    erros.data = "A data não pode estar no futuro.";
  }
  if (
    dados.km !== null &&
    (!Number.isInteger(dados.km) || dados.km < 0 || dados.km > KM_MAXIMO)
  ) {
    erros.km = "Use só números, sem casas decimais.";
  }
  if (dados.notas && dados.notas.length > 5000) {
    erros.notas = "Máximo de 5.000 caracteres.";
  }
  if (!Object.hasOwn(VISIBILIDADES, dados.visibilidade)) {
    erros.visibilidade = "Escolha uma visibilidade.";
  }

  return Object.keys(erros).length > 0
    ? { ok: false, erros }
    : { ok: true, dados: dados as DadosRegistro };
}
