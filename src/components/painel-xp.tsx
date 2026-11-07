import type { Progresso } from "@/dominio/xp";
import { REGRAS_XP } from "@/dominio/xp";

/** Nível e barra de XP. Recebe o progresso já calculado no servidor. */
export function PainelXp({ progresso }: { progresso: Progresso }) {
  const falta = progresso.doNivel - progresso.noNivel;
  return (
    <section
      aria-labelledby="titulo-xp"
      className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-xp" className="rotulo font-sans">
          Nível
        </h2>
        <span className="font-titulo text-4xl text-destaque">
          {progresso.nivel}
        </span>
      </div>
      <div
        role="meter"
        aria-labelledby="titulo-xp"
        aria-valuenow={progresso.porcento}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progresso.noNivel} de ${progresso.doNivel} XP no nível ${progresso.nivel}`}
        className="h-2 overflow-hidden rounded-md bg-borda"
      >
        <div
          className="h-full rounded-md bg-destaque"
          style={{ width: `${progresso.porcento}%` }}
        />
      </div>
      <p className="text-sm text-texto-secundario">
        {progresso.xp.toLocaleString("pt-BR")} XP · faltam{" "}
        {falta.toLocaleString("pt-BR")} para o nível {progresso.nivel + 1}
      </p>
      <details className="text-sm text-texto-secundario">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-texto hover:text-destaque focus-visible:outline-2 focus-visible:outline-destaque">
          Como ganhar XP
        </summary>
        <ul className="flex flex-col gap-1 pt-1">
          {Object.values(REGRAS_XP).map((r) => (
            <li key={r.rotulo} className="flex justify-between gap-3">
              <span>{r.rotulo}</span>
              <span className="shrink-0 text-texto-apagado">
                +{r.pontos} XP · até {r.limiteDia}/dia
              </span>
            </li>
          ))}
        </ul>
        <p className="pt-2 text-xs text-texto-apagado">
          Contado no servidor. Valor gasto não dá pontos, e apagar um registro
          apaga o XP que veio dele.
        </p>
      </details>
    </section>
  );
}
