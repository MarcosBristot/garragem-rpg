import Link from "next/link";
import { quandoEncontro } from "@/dominio/encontro";
import type { Lembrete, Sequencia } from "@/dominio/lembretes";
import type { ResumoLembretes } from "@/lib/lembretes";

// Topo do Feed e da Garagem: sequência de meses e carros que precisam de
// atenção. Calculado no servidor; some quando não há nada a dizer.

function textoSequencia(s: Sequencia): string | null {
  const meses = `${s.meses} ${s.meses === 1 ? "mês" : "meses"}`;
  if (s.emRisco) {
    const prazo =
      s.diasRestantes === 0
        ? "até hoje"
        : `nos próximos ${s.diasRestantes} ${s.diasRestantes === 1 ? "dia" : "dias"}`;
    return `Sua sequência de ${meses} está em risco: registre algo ${prazo}.`;
  }
  return s.meses >= 2 ? `${meses} seguidos cuidando do carro.` : null;
}

function textoLembrete(l: Lembrete): string {
  switch (l.tipo) {
    case "vencida":
      return `revisão vencida (Condição ${l.condicao})`;
    case "atencao":
      return `revisão chegando (Condição ${l.condicao})`;
    case "sem_manutencao":
      return "registre a última manutenção para ver a Condição";
  }
}

export function PainelLembretes({
  resumo,
}: {
  resumo: ResumoLembretes | null;
}) {
  if (!resumo) return null;
  const sequencia = textoSequencia(resumo.sequencia);
  if (
    !sequencia &&
    resumo.carros.length === 0 &&
    resumo.encontros.length === 0
  ) {
    return null;
  }

  return (
    <section
      aria-label="Lembretes da sua garagem"
      className="flex flex-col gap-2"
    >
      {resumo.encontros.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {resumo.encontros.map((e) => (
            <li key={e.id}>
              <Link
                href={`/mapa/${e.id}`}
                className="flex min-h-11 flex-col justify-center rounded-md border-2 border-destaque bg-superficie p-3 text-sm hover:bg-superficie-2"
              >
                <strong>Encontro chegando: {e.titulo}</strong>
                <span className="text-texto-secundario">
                  {quandoEncontro(e.inicio)} · {e.local_nome}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {sequencia ? (
        <p
          className={`rounded-md border-2 p-3 text-sm font-semibold ${
            resumo.sequencia.emRisco
              ? "border-erro text-erro"
              : "border-texto bg-superficie-2"
          }`}
        >
          {sequencia}
        </p>
      ) : null}
      {resumo.carros.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {resumo.carros.map(({ id, nome, lembrete }) => (
            <li key={id}>
              <Link
                href={`/garagem/carros/${id}/registros/novo`}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-md border-2 bg-superficie p-3 text-sm hover:bg-superficie-2 ${
                  lembrete.tipo === "vencida" ? "border-erro" : "border-texto"
                }`}
              >
                <span className="min-w-0">
                  <strong>{nome}</strong>: {textoLembrete(lembrete)}
                </span>
                <span className="shrink-0 font-semibold text-destaque">
                  Registrar
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
