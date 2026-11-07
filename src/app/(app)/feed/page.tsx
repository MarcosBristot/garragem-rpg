import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartaoPost } from "@/components/feed/cartao-post";
import { carregarFeed, lerCursor, type Aba } from "@/lib/feed";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Feed · Garagem RPG" };

const ABAS: Record<Aba, string> = {
  descobrir: "Descobrir",
  seguindo: "Seguindo",
};

const estiloPublicar =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-destaque px-4 font-semibold text-white hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaFeed({ searchParams }: PageProps<"/feed">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-5xl">Feed</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/pessoas"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-borda px-4 font-semibold hover:bg-borda/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
          >
            Pessoas
          </Link>
          <Link href="/feed/novo" className={estiloPublicar}>
            Publicar
          </Link>
        </div>
      </div>
      <Suspense fallback={<EsqueletoFeed />}>
        {searchParams.then((p) => (
          <Conteudo
            aba={p.aba === "seguindo" ? "seguindo" : "descobrir"}
            antes={lerCursor(p.antes)}
            falhas={Number(p.falhas) || 0}
          />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({
  aba,
  antes,
  falhas,
}: {
  aba: Aba;
  antes: string | null;
  falhas: number;
}) {
  const { supabase, perfil } = await exigirPerfil();
  const { posts, proximo } = await carregarFeed(
    supabase,
    perfil.id,
    aba,
    antes,
  );

  return (
    <>
      <nav aria-label="Abas do feed">
        <ul className="flex gap-2">
          {(Object.keys(ABAS) as Aba[]).map((chave) => (
            <li key={chave}>
              <Link
                href={chave === "descobrir" ? "/feed" : "/feed?aba=seguindo"}
                aria-current={chave === aba ? "page" : undefined}
                className="inline-flex min-h-11 items-center rounded-full border border-borda px-5 text-sm text-texto-secundario hover:text-texto aria-[current=page]:border-destaque aria-[current=page]:text-texto"
              >
                {ABAS[chave]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {falhas > 0 ? (
        <p role="alert" className="text-sm text-erro">
          O post foi publicado, mas {falhas}{" "}
          {falhas === 1 ? "foto não foi enviada" : "fotos não foram enviadas"}.
        </p>
      ) : null}

      {posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center">
          <p className="text-texto-secundario">
            {aba === "seguindo"
              ? antes
                ? "Não há posts mais antigos."
                : "Ninguém que você segue publicou ainda. Toque em Seguir nos posts de Descobrir ou procure amigos em Pessoas."
              : antes
                ? "Não há posts mais antigos."
                : "Ainda não há posts. Que tal ser o primeiro?"}
          </p>
          <Link href="/feed/novo" className={estiloPublicar}>
            Publicar
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-6">
          {posts.map((post) => (
            <li key={post.id}>
              <CartaoPost post={post} usuarioId={perfil.id} />
            </li>
          ))}
        </ol>
      )}

      {proximo ? (
        <Link
          href={`/feed?${new URLSearchParams({
            ...(aba === "seguindo" ? { aba } : {}),
            antes: proximo,
          })}`}
          className="inline-flex min-h-11 items-center justify-center self-center rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
        >
          Ver posts mais antigos
        </Link>
      ) : null}
    </>
  );
}

/** Enquanto o feed chega: o formato dos posts, pulsando. */
function EsqueletoFeed() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando o feed"
      className="flex flex-col gap-6"
    >
      {[0, 1].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl border border-borda bg-superficie motion-safe:animate-pulse"
        >
          <div className="flex items-center gap-3 p-4">
            <div className="size-11 rounded-full bg-borda" />
            <div className="flex flex-col gap-2">
              <div className="h-3 w-32 rounded bg-borda" />
              <div className="h-3 w-20 rounded bg-borda" />
            </div>
          </div>
          <div className="aspect-square bg-superficie-2" />
          <div className="h-12" />
        </div>
      ))}
    </div>
  );
}
