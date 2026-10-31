import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CabecalhoPublico } from "@/components/cabecalho-publico";
import { FotoAssinada } from "@/components/foto-assinada";
import { SilhuetaCarro } from "@/components/silhueta-carro";
import { nomeDoCarro } from "@/lib/carros";
import { perfilPublico } from "@/lib/publico";

// Perfil público: nome, cidade (nunca endereço) e só os carros públicos.

export async function generateMetadata({
  params,
}: PageProps<"/u/[usuario]">): Promise<Metadata> {
  const { usuario } = await params;
  const dados = await perfilPublico(usuario);
  if (!dados) return { title: "Página não encontrada · Garagem RPG" };
  const nome = dados.perfil.nome_exibicao ?? dados.perfil.nome_usuario;
  return {
    title: `${nome} (@${dados.perfil.nome_usuario}) · Garagem RPG`,
    description: `Garagem de ${nome} no Garagem RPG.`,
  };
}

export default function PaginaPerfilPublico({
  params,
}: PageProps<"/u/[usuario]">) {
  return (
    <>
      <CabecalhoPublico />
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10"
      >
        <Suspense
          fallback={<p className="text-texto-secundario">Carregando…</p>}
        >
          {params.then(({ usuario }) => (
            <Conteudo usuario={usuario} />
          ))}
        </Suspense>
      </main>
    </>
  );
}

async function Conteudo({ usuario }: { usuario: string }) {
  const dados = await perfilPublico(usuario);
  if (!dados) notFound();
  const { perfil, carros } = dados;
  const nome = perfil.nome_exibicao ?? perfil.nome_usuario;

  return (
    <>
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-24 place-items-center rounded-full bg-superficie-2 font-titulo text-5xl text-destaque uppercase"
        >
          {nome.charAt(0)}
        </span>
        <div>
          <h1 className="text-5xl">{nome}</h1>
          <p className="text-texto-secundario">
            @{perfil.nome_usuario}
            {perfil.cidade ? ` · ${perfil.cidade}` : null}
          </p>
        </div>
      </header>

      <section aria-labelledby="titulo-garagem" className="flex flex-col gap-4">
        <h2 id="titulo-garagem" className="text-3xl">
          Garagem
        </h2>
        {carros.length === 0 ? (
          <p className="text-texto-secundario">Nenhum carro público ainda.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {carros.map((carro) => (
              <li key={carro.id}>
                <Link
                  href={`/c/${carro.id}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-borda bg-superficie hover:border-destaque/60"
                >
                  <div className="relative grid h-40 place-items-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_100%,rgb(245_165_36/0.18),transparent_70%)]">
                    {carro.foto_capa ? (
                      <FotoAssinada
                        chave={carro.foto_capa}
                        alt=""
                        sizes="(min-width: 640px) 480px, 92vw"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <SilhuetaCarro className="w-4/5 text-destaque" />
                    )}
                  </div>
                  <span className="flex flex-col gap-1 p-5">
                    <span className="font-titulo text-3xl">
                      {nomeDoCarro(carro)}
                    </span>
                    <span className="rotulo">
                      {[carro.marca, carro.modelo, carro.ano]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="border-t border-borda pt-6 text-sm">
        <Link
          href={`/denunciar?tipo=perfil&id=${perfil.id}`}
          className="inline-flex min-h-11 items-center text-texto-secundario underline hover:text-texto"
        >
          Denunciar este perfil
        </Link>
      </p>
    </>
  );
}
