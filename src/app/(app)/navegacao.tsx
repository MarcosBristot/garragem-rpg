"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Ícones simples desenhados para o projeto (traço de 1,5 px).
const ICONES = {
  garagem: "M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  adicionar: "M12 5v14M5 12h14",
  conta: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4.4 3.6-7 8-7s8 2.6 8 7",
};

const ITENS = [
  { href: "/garagem", rotulo: "Garagem", icone: ICONES.garagem },
  {
    href: "/garagem/carros/novo",
    rotulo: "Novo carro",
    icone: ICONES.adicionar,
  },
  { href: "/conta", rotulo: "Conta", icone: ICONES.conta },
];

function ativo(caminho: string, href: string) {
  return href === "/garagem"
    ? caminho === "/garagem" || /^\/garagem\/carros\/(?!novo)/.test(caminho)
    : caminho.startsWith(href);
}

function Icone({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

// usePathname suspende em rotas com [id] (cacheComponents): o layout
// mostra a versão sem página ativa como fallback e troca em seguida.
export function NavegacaoTopoAtiva() {
  return <NavegacaoTopo caminho={usePathname()} />;
}

export function NavegacaoInferiorAtiva() {
  return <NavegacaoInferior caminho={usePathname()} />;
}

/** Links do topo (telas largas). aria-current marca a página atual. */
export function NavegacaoTopo({ caminho = "" }: { caminho?: string }) {
  return (
    <nav aria-label="Principal" className="hidden sm:block">
      <ul className="flex items-center gap-1">
        {ITENS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={ativo(caminho, item.href) ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm text-texto-secundario hover:text-texto aria-[current=page]:bg-superficie-2 aria-[current=page]:text-texto"
            >
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Barra inferior no celular, como nas redes sociais. */
export function NavegacaoInferior({ caminho = "" }: { caminho?: string }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-fundo/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <ul className="grid grid-cols-3">
        {ITENS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={ativo(caminho, item.href) ? "page" : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-texto-secundario aria-[current=page]:text-destaque"
            >
              <Icone d={item.icone} />
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
