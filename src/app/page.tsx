import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold text-destaque sm:text-5xl">
        Garagem RPG
      </h1>
      <p className="max-w-md text-lg text-texto-secundario">
        O diário de manutenção do seu carro que vira ficha de RPG.
      </p>
      <Link
        href="/garagem"
        className="inline-flex min-h-11 items-center rounded-lg bg-destaque px-6 font-semibold text-fundo hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        Abrir minha garagem
      </Link>
    </main>
  );
}
