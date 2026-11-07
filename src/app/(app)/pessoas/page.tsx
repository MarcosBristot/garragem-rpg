import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { Botao } from "@/components/formulario";
import { termoBusca, MAX_BUSCA } from "@/dominio/pessoas";
import {
  buscarPessoas,
  genteNova,
  minhasRelacoes,
  quemSigo,
  type Pessoa,
} from "@/lib/pessoas";
import { exigirPerfil } from "@/lib/sessao";
import { deixarDeSeguir, seguir } from "../pessoas-acoes";

export const metadata: Metadata = { title: "Pessoas · LifeInGears" };

// Encontrar e seguir pessoas. Quem você segue só você vê; seguir alguém
// faz os posts dela aparecerem na aba "Seguindo" do feed.

export default function PaginaPessoas({ searchParams }: PageProps<"/pessoas">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl">Pessoas</h1>
        <p className="text-texto-secundario">
          Siga quem você conhece: os posts dessa pessoa aparecem na aba Seguindo
          do feed. Só você vê quem você segue.
        </p>
      </div>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        {searchParams.then((p) => (
          <Conteudo busca={p.q} />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({ busca }: { busca: unknown }) {
  const { supabase, perfil } = await exigirPerfil();
  const termo = termoBusca(busca);
  const relacoes = await minhasRelacoes(supabase, perfil.id);
  const visivel = (p: Pessoa) => !relacoes.bloqueei.has(p.id);

  const [resultados, sigo, novas] = await Promise.all([
    termo ? buscarPessoas(supabase, perfil.id, termo) : Promise.resolve([]),
    termo ? Promise.resolve([]) : quemSigo(supabase, perfil.id),
    termo ? Promise.resolve([]) : genteNova(supabase, perfil.id),
  ]);

  return (
    <>
      {/* GET simples: funciona sem JavaScript. */}
      <form method="get" role="search" className="flex gap-2">
        <label htmlFor="busca-pessoas" className="sr-only">
          Buscar por nome ou @usuário
        </label>
        <input
          id="busca-pessoas"
          name="q"
          type="search"
          defaultValue={typeof busca === "string" ? busca : ""}
          maxLength={MAX_BUSCA + 1}
          placeholder="Nome ou @usuário"
          className="min-h-11 flex-1 rounded-lg border border-borda-campo bg-fundo px-3 text-base outline-none focus-visible:border-destaque focus-visible:ring-2 focus-visible:ring-destaque/40"
        />
        <Botao type="submit">Buscar</Botao>
      </form>

      {termo ? (
        <Secao titulo={`Resultados para "${termo}"`} id="resultados">
          <ListaPessoas
            pessoas={resultados.filter(visivel)}
            sigo={relacoes.sigo}
            vazio="Ninguém com esse nome ou @. Confira a grafia."
          />
          <Link href="/pessoas" className="text-sm text-destaque underline">
            Limpar busca
          </Link>
        </Secao>
      ) : (
        <>
          <Secao titulo="Quem você segue" id="sigo">
            <ListaPessoas
              pessoas={sigo.filter(visivel)}
              sigo={relacoes.sigo}
              vazio="Você ainda não segue ninguém. Busque pelo nome de um amigo ou veja quem chegou agora."
            />
          </Secao>
          <Secao titulo="Gente nova por aqui" id="novas">
            <ListaPessoas
              pessoas={novas
                .filter(visivel)
                .filter((p) => !relacoes.sigo.has(p.id))
                .slice(0, 12)}
              sigo={relacoes.sigo}
              vazio="Por enquanto, ninguém novo."
            />
          </Secao>
        </>
      )}
    </>
  );
}

function Secao({
  titulo,
  id,
  children,
}: {
  titulo: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`titulo-${id}`} className="flex flex-col gap-3">
      <h2 id={`titulo-${id}`} className="rotulo font-sans">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function ListaPessoas({
  pessoas,
  sigo,
  vazio,
}: {
  pessoas: Pessoa[];
  sigo: Set<string>;
  vazio: string;
}) {
  if (pessoas.length === 0) {
    return <p className="text-sm text-texto-secundario">{vazio}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {pessoas.map((p) => {
        const nome = p.nome_exibicao ?? p.nome_usuario;
        const segue = sigo.has(p.id);
        return (
          <li
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3"
          >
            <AvatarPerfil
              perfil={p}
              tamanho="48px"
              className="size-12 shrink-0"
            />
            <Link
              href={`/u/${p.nome_usuario}`}
              className="flex min-w-0 flex-1 flex-col hover:underline"
            >
              <span className="truncate font-semibold">{nome}</span>
              <span className="truncate text-sm text-texto-secundario">
                @{p.nome_usuario}
                {p.cidade ? ` · ${p.cidade}` : ""}
              </span>
            </Link>
            <form action={(segue ? deixarDeSeguir : seguir).bind(null, p.id)}>
              <Botao
                type="submit"
                variante={segue ? "secundario" : "primario"}
                aria-label={`${segue ? "Deixar de seguir" : "Seguir"} ${nome}`}
              >
                {segue ? "Seguindo ✓" : "Seguir"}
              </Botao>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
