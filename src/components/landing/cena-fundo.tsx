"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// O 3D (three.js) é pesado: carrega só no navegador, depois do texto.
// O conteúdo da página continua no HTML do servidor (SEO e leitores de tela).
const CenaCarro = dynamic(() => import("./cena-carro"), {
  ssr: false,
  loading: () => null,
});

const consulta = "(prefers-reduced-motion: reduce)";

function assinar(aviso: () => void) {
  const m = window.matchMedia(consulta);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
}

export function CenaFundo() {
  // Quem pede menos movimento vê o carro parado, sem câmera seguindo a rolagem.
  const semMovimento = useSyncExternalStore(
    assinar,
    () => window.matchMedia(consulta).matches,
    () => false,
  );

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <CenaCarro semMovimento={semMovimento} />
    </div>
  );
}
