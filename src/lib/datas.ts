// Datas do diário são só dia (AAAA-MM-DD), sem hora. Evite `new Date(texto)`
// para exibir: ele interpreta como meia-noite UTC e, no Brasil, mostra o
// dia anterior.

/** "Hoje" no fuso de São Paulo; o servidor costuma rodar em UTC. */
export function hojeEmSaoPaulo(agora: Date = new Date()): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** "2026-10-28" → "28/10/2026" */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

const MINUTO = 60_000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/**
 * Tempo relativo de um instante (timestamptz, ex.: criado_em de um post):
 * "agora", "há 5 min", "há 3 h", "há 1 dia", "há 4 dias" e, depois de
 * uma semana, a data no fuso de São Paulo. Conta horas corridas, não dias
 * do calendário (por isso "há 1 dia", e não "ontem").
 */
export function tempoDesde(instante: string, agora: Date = new Date()): string {
  const quando = new Date(instante);
  const diferenca = agora.getTime() - quando.getTime();
  if (diferenca < MINUTO) return "agora";
  if (diferenca < HORA) return `há ${Math.floor(diferenca / MINUTO)} min`;
  if (diferenca < DIA) return `há ${Math.floor(diferenca / HORA)} h`;
  const dias = Math.floor(diferenca / DIA);
  if (dias < 7) return `há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  return formatarData(hojeEmSaoPaulo(quando));
}
