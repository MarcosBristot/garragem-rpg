import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Botao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { sair } from "./acoes";

export const metadata: Metadata = { title: "Minha garagem · Garagem RPG" };

const estiloLinkPrimario =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-destaque px-4 font-semibold text-fundo hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaGaragem() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Minha garagem</h1>
        <form action={sair}>
          <Botao type="submit" variante="secundario">
            Sair
          </Botao>
        </form>
      </header>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

// Lê a sessão: redireciona quem não está logado ou não tem perfil.
async function Conteudo() {
  const { supabase, perfil } = await exigirPerfil();

  // Filtro por dono obrigatório: a RLS também libera carros públicos
  // de outras pessoas, que não pertencem à "minha" garagem.
  const { data: carros } = await supabase
    .from("carros")
    .select("id, marca, modelo, ano, apelido, publico")
    .eq("dono_id", perfil.id)
    .order("criado_em");

  return (
    <>
      <p className="-mt-4 text-texto-secundario">
        @{perfil.nome_usuario}
        {perfil.cidade ? ` · ${perfil.cidade}` : null}
      </p>

      {carros && carros.length > 0 ? (
        <section
          aria-labelledby="titulo-carros"
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 id="titulo-carros" className="text-xl font-bold">
              Carros
            </h2>
            <Link href="/garagem/carros/novo" className={estiloLinkPrimario}>
              Adicionar carro
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {carros.map((carro) => (
              <li
                key={carro.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-borda bg-superficie p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {carro.apelido ?? `${carro.marca} ${carro.modelo}`}
                  </p>
                  <p className="truncate text-sm text-texto-secundario">
                    {[carro.marca, carro.modelo, carro.ano]
                      .filter(Boolean)
                      .join(" · ")}
                    {" · "}
                    {carro.publico ? "Público" : "Privado"}
                  </p>
                </div>
                <Link
                  href={`/garagem/carros/${carro.id}/editar`}
                  aria-label={`Editar ${carro.apelido ?? `${carro.marca} ${carro.modelo}`}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-borda px-4 text-sm font-semibold hover:bg-borda/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
                >
                  Editar
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-borda bg-superficie p-8 text-center">
          <h2 className="text-xl font-bold">Sua garagem está vazia</h2>
          <p className="text-texto-secundario">
            Cadastre seu carro para começar o diário.
          </p>
          <Link href="/garagem/carros/novo" className={estiloLinkPrimario}>
            Adicionar carro
          </Link>
        </section>
      )}
    </>
  );
}
