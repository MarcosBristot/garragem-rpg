// Atributos do carro (0–100), calculados no servidor a partir dos totais
// que o banco entrega (public.ficha_do_carro). Funções puras e testadas.
// Regras do domínio: dinheiro gasto nunca entra; tudo tem teto ou retorno
// decrescente, então repetir a mesma ação não infla o número para sempre.

import { calcularCondicao } from "./condicao";

/** Totais devolvidos por public.ficha_do_carro (mesmos nomes do JSON). */
export type Insumos = {
  potencia_cv: number | null;
  mods_motor: number;
  curtidores: number;
  diy_com_prova: number;
  reaproveitadas: number;
  meses_ativos_12m: number;
  registros_12m: number;
  completos_12m: number;
  xp: number;
  ultima_manutencao: string | null; // AAAA-MM-DD
  km_ultima_manutencao: number | null;
  km_atual: number | null;
};

export type Atributos = {
  potencia: number;
  estilo: number;
  engenhosidade: number;
  dedicacao: number;
  /** null enquanto não há manutenção registrada. */
  condicao: number | null;
};

export const POTENCIA = {
  /** cv de fábrica ÷ 4, até 60 pontos (240 cv já dá o máximo). */
  cvPorPonto: 4,
  maxFabrica: 60,
  pontosPorModMotor: 10,
  maxMods: 40,
};
/** Escala das curvas: com "escala" unidades, o atributo chega a ~63. */
export const ESCALA_ESTILO = 25;
export const ESCALA_ENGENHOSIDADE = 20;
export const DEDICACAO = { pontosPorMes: 5, maxQualidade: 40 };

const limitar = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
const inteiro = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;

/** Curva que satura: cresce rápido no começo e nunca passa de 100. */
export function curva(quantidade: number, escala: number): number {
  return limitar(100 * (1 - Math.exp(-inteiro(quantidade) / escala)));
}

export function calcularAtributos(i: Insumos, hoje: string): Atributos {
  const fabrica = Math.min(
    POTENCIA.maxFabrica,
    inteiro(i.potencia_cv) / POTENCIA.cvPorPonto,
  );
  const mods = Math.min(
    POTENCIA.maxMods,
    inteiro(i.mods_motor) * POTENCIA.pontosPorModMotor,
  );

  const registros = inteiro(i.registros_12m);
  const qualidade =
    registros > 0
      ? Math.min(1, inteiro(i.completos_12m) / registros) *
        DEDICACAO.maxQualidade
      : 0;
  const frequencia =
    Math.min(12, inteiro(i.meses_ativos_12m)) * DEDICACAO.pontosPorMes;

  // Condição reaproveita a função já testada, com só o que importa a ela:
  // a última manutenção e o maior km conhecido.
  const condicao = i.ultima_manutencao
    ? calcularCondicao(
        [
          {
            tipo: "manutencao",
            data: i.ultima_manutencao,
            km: i.km_ultima_manutencao,
          },
          { tipo: "modificacao", data: i.ultima_manutencao, km: i.km_atual },
        ],
        hoje,
      )
    : null;

  return {
    potencia: limitar(fabrica + mods),
    estilo: curva(i.curtidores, ESCALA_ESTILO),
    engenhosidade: curva(
      2 * inteiro(i.diy_com_prova) + inteiro(i.reaproveitadas),
      ESCALA_ENGENHOSIDADE,
    ),
    dedicacao: limitar(frequencia + qualidade),
    condicao: condicao?.valor ?? null,
  };
}

/** Lê o JSON do banco com segurança (campo faltando vira 0/null). */
export function lerInsumos(json: unknown): Insumos | null {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    return null;
  }
  const d = json as Record<string, unknown>;
  const numero = (k: string) => inteiro(d[k]);
  const ouNull = (k: string) =>
    typeof d[k] === "number" && Number.isFinite(d[k]) ? (d[k] as number) : null;
  const data = d.ultima_manutencao;
  return {
    potencia_cv: ouNull("potencia_cv"),
    mods_motor: numero("mods_motor"),
    curtidores: numero("curtidores"),
    diy_com_prova: numero("diy_com_prova"),
    reaproveitadas: numero("reaproveitadas"),
    meses_ativos_12m: numero("meses_ativos_12m"),
    registros_12m: numero("registros_12m"),
    completos_12m: numero("completos_12m"),
    xp: numero("xp"),
    ultima_manutencao:
      typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)
        ? data
        : null,
    km_ultima_manutencao: ouNull("km_ultima_manutencao"),
    km_atual: ouNull("km_atual"),
  };
}
