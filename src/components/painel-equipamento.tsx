import { espacosOcupados, type Equipamento } from "@/dominio/equipamento";
import { ESPACOS, type Espaco } from "@/dominio/item";
import { formatarData } from "@/lib/datas";

// Espaços de equipamento, como os slots de um personagem. Ícones simples
// desenhados para o projeto (traço de 1,5 px), sem arte de terceiros.
const ICONES: Record<Espaco, string> = {
  motor: "M5 9h3l2-2h4l2 2h3v7h-3l-2 2h-4l-2-2H5zM2 11v3M22 11v3",
  suspensao: "M12 3v3M8 6h8M8 9l8 2-8 2 8 2-8 2M8 18h8M12 18v3",
  rodas:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v6M12 15v6M3 12h6M15 12h6",
  freios:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM17 5l2 3-2 3",
  estetica:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z",
  som: "M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11",
};

export function PainelEquipamento({
  equipamento,
  dono = false,
}: {
  equipamento: Equipamento;
  /** Na página do dono, espaço vazio ganha a dica de como preencher. */
  dono?: boolean;
}) {
  const ocupados = espacosOcupados(equipamento);
  const total = Object.keys(ESPACOS).length;

  return (
    <section
      aria-labelledby="titulo-equipamento"
      className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-equipamento" className="rotulo font-sans">
          Equipamento
        </h2>
        <p className="text-sm text-texto-secundario">
          {ocupados} de {total} espaços
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(Object.keys(ESPACOS) as Espaco[]).map((espaco) => {
          const slot = equipamento[espaco];
          return (
            <li
              key={espaco}
              className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 ${
                slot.atual
                  ? "border-destaque/40 bg-superficie-2"
                  : "border-dashed border-borda"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={`size-5 shrink-0 ${slot.atual ? "text-destaque" : "text-texto-apagado"}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={ICONES[espaco]} />
                </svg>
                <span className="rotulo text-[0.7rem]">{ESPACOS[espaco]}</span>
              </span>
              {slot.atual ? (
                <>
                  <span className="line-clamp-2 text-sm font-medium">
                    {slot.atual.descricao}
                  </span>
                  <span className="text-xs text-texto-apagado">
                    desde{" "}
                    <time dateTime={slot.atual.data}>
                      {formatarData(slot.atual.data)}
                    </time>
                    {slot.total > 1
                      ? ` · ${slot.total} peças no histórico`
                      : null}
                  </span>
                </>
              ) : (
                <span className="text-sm text-texto-apagado">Vazio</span>
              )}
            </li>
          );
        })}
      </ul>
      {dono ? (
        <p className="text-xs text-texto-apagado">
          Ao adicionar um item num registro, escolha o Espaço: a peça mais
          recente de cada espaço fica equipada.
        </p>
      ) : null}
    </section>
  );
}
