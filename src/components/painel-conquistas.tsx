import type { Conquista } from "@/dominio/conquistas";

// Medalhas do carro. Desbloqueadas em âmbar; as outras apagadas, com o
// progresso. Ícone de medalha desenhado para o projeto (sem arte de terceiros).
const MEDALHA =
  "M8 3h8l-2.5 5h-3zM12 8.5a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM12 11.5l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z";

export function PainelConquistas({
  conquistas,
  publico = false,
}: {
  conquistas: Conquista[];
  /**
   * Na ficha pública, só as desbloqueadas e sem progresso: "2 de 50
   * registros" revelaria quantos registros (inclusive privados) existem.
   */
  publico?: boolean;
}) {
  const feitas = conquistas.filter((c) => c.desbloqueada).length;
  const visiveis = publico
    ? conquistas.filter((c) => c.desbloqueada)
    : conquistas;
  // Desbloqueadas primeiro; depois as mais perto de sair.
  const ordenadas = [...visiveis].sort(
    (a, b) =>
      Number(b.desbloqueada) - Number(a.desbloqueada) ||
      b.atual / b.alvo - a.atual / a.alvo,
  );

  return (
    <section
      aria-labelledby="titulo-conquistas"
      className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="titulo-conquistas" className="rotulo font-sans">
          Conquistas
        </h2>
        <p className="text-sm text-texto-secundario">
          {feitas} de {conquistas.length}
        </p>
      </div>
      {ordenadas.length === 0 ? (
        <p className="text-sm text-texto-secundario">
          Nenhuma conquista desbloqueada ainda.
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ordenadas.map((c) => (
          <li
            key={c.id}
            className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 ${
              c.desbloqueada
                ? "border-destaque/40 bg-superficie-2"
                : "border-dashed border-borda"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`size-6 shrink-0 ${c.desbloqueada ? "text-destaque" : "text-texto-apagado"}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinejoin="round"
              >
                <path d={MEDALHA} />
              </svg>
              <span
                className={`text-sm font-semibold ${c.desbloqueada ? "" : "text-texto-secundario"}`}
              >
                {c.nome}
              </span>
            </span>
            <span className="text-xs text-texto-apagado">{c.descricao}</span>
            <span
              className={`text-xs ${c.desbloqueada ? "text-destaque" : "text-texto-secundario"}`}
            >
              {c.desbloqueada
                ? "Desbloqueada"
                : `${c.atual.toLocaleString("pt-BR")} de ${c.alvo.toLocaleString("pt-BR")}${c.unidade ? ` ${c.unidade}` : ""}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
