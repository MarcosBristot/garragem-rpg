import type { Condicao } from "@/dominio/condicao";
import { INTERVALO_DIAS, INTERVALO_KM } from "@/dominio/condicao";
import { formatarData } from "@/lib/datas";

/** Barra de Condição. Recebe o valor já calculado no servidor. */
export function PainelCondicao({ condicao }: { condicao: Condicao | null }) {
  return (
    <section
      aria-labelledby="titulo-condicao"
      className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-condicao" className="rotulo font-sans">
          Condição
        </h2>
        {condicao ? (
          <span className="font-titulo text-4xl text-condicao">
            {condicao.valor}
          </span>
        ) : null}
      </div>
      {condicao ? (
        <>
          <div
            role="meter"
            aria-labelledby="titulo-condicao"
            aria-valuenow={condicao.valor}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 overflow-hidden rounded-md bg-borda"
          >
            <div
              className="h-full rounded-md bg-condicao"
              style={{ width: `${condicao.valor}%` }}
            />
          </div>
          <p className="text-sm text-texto-secundario">
            Última manutenção em{" "}
            <time dateTime={condicao.ultimaManutencao}>
              {formatarData(condicao.ultimaManutencao)}
            </time>{" "}
            · há {condicao.diasDesde}{" "}
            {condicao.diasDesde === 1 ? "dia" : "dias"}
            {condicao.kmDesde !== null
              ? ` · ${condicao.kmDesde.toLocaleString("pt-BR")} km desde então`
              : null}
          </p>
        </>
      ) : (
        <p className="text-sm text-texto-secundario">
          Registre a última manutenção para ver a Condição do carro.
        </p>
      )}
      <p className="text-xs text-texto-apagado">
        Cai com o tempo e os km desde a última manutenção (referência:{" "}
        {INTERVALO_KM.toLocaleString("pt-BR")} km ou {INTERVALO_DIAS / 365} ano,
        o que vier primeiro) e volta a 100 a cada manutenção. Informativo, não é
        laudo técnico.
      </p>
    </section>
  );
}
