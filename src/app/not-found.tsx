import Link from "next/link";

// Mesma mensagem para "não existe" e "não é seu": não revelar que um
// carro de outra pessoa existe.
export default function NaoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-texto-secundario">
        Ela não existe ou você não tem acesso a ela.
      </p>
      <Link
        href="/garagem"
        className="inline-flex min-h-11 items-center rounded-lg bg-destaque px-6 font-semibold text-fundo hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        Ir para minha garagem
      </Link>
    </main>
  );
}
