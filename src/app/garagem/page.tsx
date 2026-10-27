import type { Metadata } from "next";
import { Suspense } from "react";
import { Botao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Minha garagem · Garagem RPG" };

export default function PaginaGaragem() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha garagem</h1>
          <Suspense fallback={<p className="text-texto-secundario">…</p>}>
            <Identificacao />
          </Suspense>
        </div>
        <form action={sair}>
          <Botao type="submit" variante="secundario">
            Sair
          </Botao>
        </form>
      </header>

      <section className="rounded-xl border border-dashed border-borda bg-superficie p-8 text-center">
        <h2 className="text-xl font-bold">Sua garagem está vazia</h2>
        <p className="mt-2 text-texto-secundario">
          Em breve: cadastre seu carro e comece o diário.
        </p>
      </section>
    </main>
  );
}

// Lê a sessão: redireciona quem não está logado ou não tem perfil.
async function Identificacao() {
  const { perfil } = await exigirPerfil();
  return (
    <p className="text-texto-secundario">
      @{perfil.nome_usuario}
      {perfil.cidade ? ` · ${perfil.cidade}` : null}
    </p>
  );
}
