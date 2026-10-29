// Dinheiro é sempre inteiro em centavos. Nada de float: 0,1 + 0,2 ≠ 0,3.

/** Até R$ 9.999.999,99: cabe no `integer` do Postgres (máx. ~21 milhões). */
const REAIS = /^(\d{1,7})(?:,(\d{1,2}))?$/;

/**
 * "R$ 1.234,5" → 123450. Texto vazio → null. Inválido → undefined.
 * Aceita o formato brasileiro: ponto de milhar e vírgula decimal.
 */
export function reaisParaCentavos(texto: string): number | null | undefined {
  const limpo = texto.replace(/R\$|\s|\./g, "");
  if (limpo === "") return null;
  const m = REAIS.exec(limpo);
  if (!m) return undefined;
  return Number(m[1]) * 100 + Number((m[2] ?? "0").padEnd(2, "0"));
}

/** 123450 → "1234,50" (para preencher o campo de edição). */
export function centavosParaCampo(centavos: number): string {
  return `${Math.trunc(centavos / 100)},${String(centavos % 100).padStart(2, "0")}`;
}

/** 123450 → "R$ 1.234,50" */
export function formatarReais(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}
