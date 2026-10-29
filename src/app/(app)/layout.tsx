import { Suspense } from "react";
import { Marca } from "@/components/marca";
import {
  NavegacaoInferior,
  NavegacaoInferiorAtiva,
  NavegacaoTopo,
  NavegacaoTopoAtiva,
} from "./navegacao";

// Moldura da área logada. Não lê a sessão: fica na casca estática e
// aparece na hora; cada página confere o login dentro do <Suspense>.
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-16 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-borda bg-fundo/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4">
          <Marca href="/garagem" />
          <Suspense fallback={<NavegacaoTopo />}>
            <NavegacaoTopoAtiva />
          </Suspense>
        </div>
      </header>
      {children}
      <Suspense fallback={<NavegacaoInferior />}>
        <NavegacaoInferiorAtiva />
      </Suspense>
    </div>
  );
}
