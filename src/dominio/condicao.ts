// Condição (0–100): o quanto o carro está "em dia" com a manutenção.
// Função pura, sem relógio nem banco: "hoje" entra como parâmetro e é
// sempre calculada no servidor (regra 4: jogo justo).
//
// Modelo v1, como um plano de revisão: "a cada INTERVALO_KM ou
// INTERVALO_DIAS, o que vier primeiro". Logo após uma manutenção: 100.
// No vencimento do intervalo: 50. Com o dobro do intervalo: 0.
// Dinheiro gasto não entra na conta (regra de domínio).

export const INTERVALO_KM = 10_000;
export const INTERVALO_DIAS = 365;

export type RegistroParaCondicao = {
  tipo: "manutencao" | "modificacao";
  data: string; // AAAA-MM-DD
  km: number | null;
};

export type Condicao = {
  valor: number; // 0–100
  diasDesde: number;
  kmDesde: number | null; // null quando não há km para comparar
  ultimaManutencao: string; // AAAA-MM-DD
};

const MS_POR_DIA = 86_400_000;

/** Dias entre duas datas AAAA-MM-DD (sem fuso: só o calendário). */
export function diasEntre(de: string, ate: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  return Math.round(
    (Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / MS_POR_DIA,
  );
}

/** null quando ainda não há nenhuma manutenção registrada. */
export function calcularCondicao(
  registros: RegistroParaCondicao[],
  hoje: string,
): Condicao | null {
  const manutencoes = registros
    .filter((r) => r.tipo === "manutencao")
    // Mais recente primeiro; empate na data: a de maior km.
    .sort(
      (a, b) => b.data.localeCompare(a.data) || (b.km ?? -1) - (a.km ?? -1),
    );
  const ultima = manutencoes[0];
  if (!ultima) return null;

  const diasDesde = Math.max(0, diasEntre(ultima.data, hoje));

  // Km atual = maior km já registrado (qualquer tipo de registro).
  const kms = registros.flatMap((r) => (r.km === null ? [] : [r.km]));
  const kmAtual = kms.length > 0 ? Math.max(...kms) : null;
  const kmDesde =
    ultima.km !== null && kmAtual !== null
      ? Math.max(0, kmAtual - ultima.km)
      : null;

  const fracao = Math.max(
    diasDesde / INTERVALO_DIAS,
    kmDesde === null ? 0 : kmDesde / INTERVALO_KM,
  );
  const valor = Math.round(Math.min(100, Math.max(0, 100 - 50 * fracao)));

  return { valor, diasDesde, kmDesde, ultimaManutencao: ultima.data };
}
