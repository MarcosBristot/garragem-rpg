import type { Atributos } from "@/dominio/atributos";
import type { Progresso } from "@/dominio/xp";

// Atributos do carro (0–100), já calculados no servidor. Serve na página
// do dono (com dicas de como subir) e na ficha pública (com o nível).

const ATRIBUTOS: {
  chave: keyof Atributos;
  nome: string;
  dica: string;
}[] = [
  {
    chave: "potencia",
    nome: "Potência",
    dica: "Potência de fábrica (em Editar carro) e modificações com peça no espaço Motor.",
  },
  {
    chave: "estilo",
    nome: "Estilo",
    dica: "Pessoas diferentes que curtiram os posts do carro.",
  },
  {
    chave: "engenhosidade",
    nome: "Engenhosidade",
    dica: 'Registros "fiz eu mesmo" com foto ou item, e peças reaproveitadas.',
  },
  {
    chave: "dedicacao",
    nome: "Dedicação",
    dica: "Meses com registro no último ano e registros completos (km + item ou foto).",
  },
  {
    chave: "condicao",
    nome: "Condição",
    dica: "Tempo e km desde a última manutenção.",
  },
];

export function PainelAtributos({
  atributos,
  nivel,
  semCondicao = false,
  comDicas = false,
}: {
  atributos: Atributos;
  /** Na ficha pública, o nível aparece no topo. */
  nivel?: Progresso;
  /** Na página do dono a Condição já tem painel próprio. */
  semCondicao?: boolean;
  comDicas?: boolean;
}) {
  const lista = semCondicao
    ? ATRIBUTOS.filter((a) => a.chave !== "condicao")
    : ATRIBUTOS;

  return (
    <section
      aria-labelledby="titulo-atributos"
      className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-atributos" className="rotulo font-sans">
          Atributos
        </h2>
        {nivel ? (
          <p className="text-sm text-texto-secundario">
            Nível{" "}
            <span className="font-titulo text-3xl text-destaque">
              {nivel.nivel}
            </span>
            <span className="sr-only"> ({nivel.xp} XP)</span>
          </p>
        ) : null}
      </div>
      <ul className="flex flex-col gap-3">
        {lista.map(({ chave, nome, dica }) => {
          const valor = atributos[chave];
          const id = `atributo-${chave}`;
          return (
            <li key={chave} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span id={id} className="text-sm font-medium">
                  {nome}
                </span>
                <span aria-hidden="true" className="font-titulo text-2xl">
                  {valor ?? <span className="text-texto-apagado">—</span>}
                </span>
              </div>
              <div
                role="meter"
                aria-labelledby={id}
                aria-valuenow={valor ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={valor === null ? "Sem dados ainda" : undefined}
                className="h-1.5 overflow-hidden rounded-full bg-borda"
              >
                <div
                  className={`h-full rounded-full ${chave === "condicao" ? "bg-condicao" : "bg-destaque"}`}
                  style={{ width: `${valor ?? 0}%` }}
                />
              </div>
              {comDicas ? (
                <p className="text-xs text-texto-apagado">{dica}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-texto-apagado">
        Calculados pelo Garagem RPG a partir do diário. Valor gasto nunca conta.
      </p>
    </section>
  );
}
