import Link from "next/link";
import { Suspense } from "react";
import { Marca } from "@/components/marca";
import { usuarioLogado } from "@/lib/sessao";

/**
 * Cabeçalho das páginas públicas (perfil e carro). O resto da página é
 * estático; só o botão da direita olha a sessão: quem já tem conta volta
 * para o feed em vez de ver o convite.
 */
export function CabecalhoPublico() {
  return (
    <header className="border-b border-borda">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4">
        <Marca />
        <Suspense fallback={<Convite />}>
          <AcaoDoCabecalho />
        </Suspense>
      </div>
    </header>
  );
}

const estilo =
  "inline-flex min-h-11 items-center rounded-md border-2 border-texto bg-destaque sombra-botao px-5 text-sm font-semibold text-white hover:bg-destaque/90";

function Convite() {
  return (
    <Link href="/entrar" className={estilo}>
      Criar minha garagem
    </Link>
  );
}

async function AcaoDoCabecalho() {
  const { usuarioId } = await usuarioLogado();
  if (!usuarioId) return <Convite />;
  return (
    <Link href="/feed" className={estilo}>
      Voltar ao feed
    </Link>
  );
}
