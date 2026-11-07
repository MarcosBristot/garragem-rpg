import { REGRAS_XP, type Recompensa } from "@/dominio/xp";

// Cartão que aparece logo depois de salvar um registro: o XP ganho, a barra
// enchendo e, se subiu de nível, uma comemoração. Tudo calculado no servidor;
// as animações só rodam para quem não pediu "menos movimento".

const CORES = ["#5b3fd0", "#9dbbe0", "#167a3d", "#f3b54a", "#e4609b"];

function Confete() {
  // 18 pedacinhos saindo do centro em direções fixas (sem aleatório: o
  // HTML do servidor e o do navegador ficam iguais).
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: 18 }, (_, i) => {
        const angulo = (i / 18) * Math.PI * 2;
        const raio = 90 + (i % 3) * 40;
        return (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 hidden size-2 rounded-sm motion-safe:block motion-safe:animate-confete"
            style={
              {
                background: CORES[i % CORES.length],
                animationDelay: `${(i % 4) * 60}ms`,
                "--dx": `${Math.round(Math.cos(angulo) * raio)}px`,
                "--dy": `${Math.round(Math.sin(angulo) * raio - 30)}px`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

export function RecompensaXp({
  recompensa,
  ancoraItens,
}: {
  recompensa: Recompensa;
  /** Id da seção de itens, para o atalho "adicionar peça". */
  ancoraItens: string;
}) {
  const { ganho, progresso, subiuDeNivel, nivelAntes } = recompensa;
  const falta = progresso.doNivel - progresso.noNivel;
  // A barra parte de onde estava antes do ganho (quando não mudou de nível).
  const antes = subiuDeNivel
    ? 0
    : Math.max(
        0,
        Math.floor(((progresso.noNivel - ganho) / progresso.doNivel) * 100),
      );

  return (
    <section
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-3xl border border-destaque/30 bg-destaque/5 p-5"
    >
      {subiuDeNivel ? <Confete /> : null}
      {ganho > 0 ? (
        <div className="flex items-center gap-4">
          <span className="shrink-0 font-titulo text-5xl whitespace-nowrap text-destaque motion-safe:animate-pulo">
            +{ganho} XP
          </span>
          <p className="text-sm text-texto-secundario">
            {subiuDeNivel ? (
              <>
                <strong className="block text-lg text-texto">
                  Subiu para o nível {progresso.nivel}!
                </strong>
                Era nível {nivelAntes}. Continue cuidando do carro.
              </>
            ) : (
              <>
                Registro salvo. Faltam{" "}
                <strong className="text-texto">{falta} XP</strong> para o nível{" "}
                {progresso.nivel + 1}.
              </>
            )}
          </p>
        </div>
      ) : (
        <p className="text-sm text-texto-secundario">
          <strong className="block text-texto">Registro salvo!</strong>
          Hoje este tipo de registro já rendeu o máximo de XP. O limite diário
          deixa o jogo justo: volte amanhã para ganhar mais.
        </p>
      )}

      <div
        role="meter"
        aria-label={`Nível ${progresso.nivel}`}
        aria-valuenow={progresso.porcento}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-4 h-2 overflow-hidden rounded-full bg-borda"
      >
        <div
          className="h-full rounded-full bg-destaque motion-safe:animate-encher"
          style={
            {
              width: `${progresso.porcento}%`,
              "--de": `${antes}%`,
            } as React.CSSProperties
          }
        />
      </div>

      <p className="mt-3 text-sm">
        Ganhe mais agora:{" "}
        <a
          href={`#${ancoraItens}`}
          className="font-semibold text-destaque underline"
        >
          cada peça ou serviço +{REGRAS_XP.item.pontos} XP
        </a>{" "}
        · cada foto +{REGRAS_XP.foto.pontos} XP.
      </p>
    </section>
  );
}
