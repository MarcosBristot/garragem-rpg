"use client";

import { useOptimistic, useTransition } from "react";
import { alternarCurtida } from "@/app/(app)/feed/acoes";

// Coração com resposta imediata (useOptimistic): a tela muda no clique e o
// servidor confirma depois. Se o banco recusar, a próxima atualização da
// página volta ao valor real.

const CORACAO =
  "M12 20.5s-7.5-4.4-9.3-9.2C1.4 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.3 4.3 6.8C19.5 16.1 12 20.5 12 20.5z";

export function BotaoCurtir({
  postId,
  curtido,
  total,
  proprio,
}: {
  postId: string;
  curtido: boolean;
  total: number;
  /** Ninguém curte o próprio post: mostra só o total. */
  proprio: boolean;
}) {
  const [estado, aplicar] = useOptimistic(
    { curtido, total },
    (_atual, novo: { curtido: boolean; total: number }) => novo,
  );
  const [, iniciar] = useTransition();
  const rotuloTotal = `${estado.total} ${estado.total === 1 ? "curtida" : "curtidas"}`;

  if (proprio) {
    return (
      <span className="inline-flex min-h-11 items-center gap-2 px-1 text-sm text-texto-secundario">
        <Coracao cheio={false} />
        {rotuloTotal}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={estado.curtido}
      aria-label={`Curtir (${rotuloTotal})`}
      onClick={() =>
        iniciar(async () => {
          const curtir = !estado.curtido;
          aplicar({ curtido: curtir, total: estado.total + (curtir ? 1 : -1) });
          await alternarCurtida(postId, curtir);
        })
      }
      className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-texto-secundario hover:bg-superficie-2 hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque aria-pressed:text-destaque"
    >
      {/* key: ao curtir, o coração é recriado e a animação "pulo" roda. */}
      <Coracao key={String(estado.curtido)} cheio={estado.curtido} pular />
      <span aria-hidden="true">{estado.total}</span>
    </button>
  );
}

function Coracao({
  cheio,
  pular = false,
}: {
  cheio: boolean;
  pular?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`size-6 ${cheio && pular ? "motion-safe:animate-pulo" : ""}`}
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    >
      <path d={CORACAO} />
    </svg>
  );
}
