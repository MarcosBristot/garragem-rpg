"use client";

import dynamic from "next/dynamic";
import type { PontoEncontro } from "./mapa-encontros";

// Páginas do servidor não podem usar dynamic(..., { ssr: false }); este
// invólucro de cliente pode. O mapa (WebGL, ~1 MB) só baixa no navegador.
const MapaEncontros = dynamic(
  () => import("./mapa-encontros").then((m) => m.MapaEncontros),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-superficie-2 text-sm text-texto-secundario">
        Carregando o mapa…
      </div>
    ),
  },
);

export function MapaVer({
  encontros,
  rotulo,
  zoomMaximo,
}: {
  encontros: PontoEncontro[];
  rotulo: string;
  zoomMaximo?: number;
}) {
  return (
    <MapaEncontros
      modo="ver"
      encontros={encontros}
      rotulo={rotulo}
      zoomMaximo={zoomMaximo}
    />
  );
}
