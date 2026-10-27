export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold text-destaque sm:text-5xl">
        Garagem RPG
      </h1>
      <p className="max-w-md text-lg text-texto-secundario">
        O diário de manutenção do seu carro que vira ficha de RPG.
      </p>
      <p className="rounded-lg border border-borda bg-superficie px-4 py-3 text-sm">
        Em construção: fase 1, garagem e diário.
      </p>
    </main>
  );
}
