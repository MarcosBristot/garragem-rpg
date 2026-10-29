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
