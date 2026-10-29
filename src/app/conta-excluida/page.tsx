import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conta excluída · Garagem RPG",
  robots: { index: false },
};

export default function PaginaContaExcluida() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center"
    >
      <h1 className="text-5xl">Conta excluída</h1>
      <p className="max-w-md text-texto-secundario">
        Seu perfil, carros, registros, itens, notas e histórico foram apagados.
        Obrigado por ter usado o Garagem RPG.
      </p>
      <Link href="/" className="text-destaque underline">
        Voltar ao início
      </Link>
    </main>
  );
}
