"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Personagem } from "@/dominio/personagem";
import { useMenosMovimento } from "@/lib/use-menos-movimento";
import { AvatarPersonagem } from "./avatar-personagem";

// O three.js só carrega no navegador e só onde o boneco aparece. Até lá
// (ou sem WebGL), fica a versão 2D do mesmo personagem.
const CenaBoneco = dynamic(() => import("./cena-boneco"), {
  ssr: false,
  loading: () => null,
});

export function Boneco({
  personagem,
  rotulo,
  className = "",
}: {
  personagem: Personagem;
  rotulo: string;
  className?: string;
}) {
  const semMovimento = useMenosMovimento();
  const [pronto, setPronto] = useState(false);

  return (
    <div
      role="img"
      aria-label={rotulo}
      className={`relative touch-pan-y overflow-hidden rounded-3xl border border-borda fundo-vitrine ${className}`}
    >
      {pronto ? null : (
        <AvatarPersonagem
          personagem={personagem}
          className="absolute inset-0 m-auto size-1/2"
        />
      )}
      <CenaBoneco
        personagem={personagem}
        semMovimento={semMovimento}
        aoCarregar={() => setPronto(true)}
      />
    </div>
  );
}
