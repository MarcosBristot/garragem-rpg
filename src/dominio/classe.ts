// Classe do carro = liga do ranking (decisão do dono do produto: escolhida
// pelo dono do carro). Mesma lista do CHECK de carros.classe.

export const CLASSES = {
  hatch: "Hatch",
  seda: "Sedã",
  suv: "SUV",
  picape: "Picape",
  esportivo: "Esportivo",
  classico: "Clássico (25+ anos)",
} as const;

export type Classe = keyof typeof CLASSES;

/** Clássico: carro com pelo menos 25 anos (como a placa preta). */
export const IDADE_CLASSICO = 25;

export function ehClasse(valor: unknown): valor is Classe {
  // Object.hasOwn: "toString" e afins não passam.
  return typeof valor === "string" && Object.hasOwn(CLASSES, valor);
}

/**
 * Confere a classe escolhida. Vazio é permitido (o carro só fica fora do
 * ranking). Clássico exige o ano, e ano de pelo menos 25 anos atrás.
 */
export function erroDaClasse(
  classe: string | null,
  ano: number | null,
  anoAtual: number,
): string | null {
  if (classe === null) return null;
  if (!ehClasse(classe)) return "Escolha uma classe da lista.";
  if (
    classe === "classico" &&
    (ano === null || anoAtual - ano < IDADE_CLASSICO)
  ) {
    return `Clássico é para carros com ${IDADE_CLASSICO} anos ou mais (informe o ano).`;
  }
  return null;
}
