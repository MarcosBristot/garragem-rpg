"use client";

import dynamic from "next/dynamic";
import { useMenosMovimento } from "@/lib/use-menos-movimento";

// O 3D (three.js) é pesado: carrega só no navegador, depois do texto.
// O conteúdo da página continua no HTML do servidor (SEO e leitores de tela).
const CenaCarro = dynamic(() => import("./cena-carro"), {
  ssr: false,
  loading: () => null,
});

export function CenaFundo() {
  // Quem pede menos movimento vê o carro parado, sem câmera seguindo a rolagem.
  const semMovimento = useMenosMovimento();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <CenaCarro semMovimento={semMovimento} />
    </div>
  );
}
