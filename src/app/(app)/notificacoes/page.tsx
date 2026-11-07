import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { FotoAssinada } from "@/components/foto-assinada";
import {
  agrupar,
  frase,
  type Grupo,
  type Notificacao,
} from "@/dominio/notificacoes";
import { tempoDesde } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";
import { MarcarVistas } from "./marcar-vistas";

export const metadata: Metadata = { title: "Notificações · Garagem RPG" };

// Curtidas e comentários nos seus posts e novos seguidores. Quem pode
// aparecer aqui é decidido no banco (RLS + bloqueios); a página só agrupa.

export default function PaginaNotificacoes() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <h1 className="text-5xl">Notificações</h1>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const { supabase, perfil } = await exigirPerfil();

  const [{ data: itens, error }, { data: eu }] = await Promise.all([
    supabase.rpc("minhas_notificacoes", { p_limite: 60 }),
    supabase
      .from("perfis")
      .select("notificacoes_vistas_em")
      .eq("id", perfil.id)
      .maybeSingle(),
  ]);
  if (error) throw new Error(`Notificações: ${error.code}`);
  const grupos = agrupar(
    (itens ?? []) as Notificacao[],
    eu?.notificacoes_vistas_em ?? null,
  );

  // Quem fez (perfis são públicos) e a 1ª foto de cada post citado.
  const atores = [...new Set(grupos.flatMap((g) => g.atores))];
  const postIds = [
    ...new Set(grupos.flatMap((g) => (g.post_id ? [g.post_id] : []))),
  ];
  const [{ data: perfis }, { data: posts }] = await Promise.all([
    atores.length
      ? supabase
          .from("perfis")
          .select("id, nome_usuario, nome_exibicao, personagem, foto")
          .in("id", atores)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase
          .from("posts")
          .select("id, fotos_post (chave)")
          .in("id", postIds)
          .order("criado_em", { referencedTable: "fotos_post" })
          .limit(1, { referencedTable: "fotos_post" })
      : Promise.resolve({ data: [] }),
  ]);
  const perfilDe = new Map((perfis ?? []).map((p) => [p.id, p]));
  const fotoDe = new Map(
    (posts ?? []).map((p) => [p.id, p.fotos_post[0]?.chave ?? null]),
  );

  if (grupos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center">
        <p className="text-texto-secundario">
          Nada por aqui ainda. Publique uma foto do seu carro e siga seus
          amigos: curtidas, comentários e novos seguidores aparecem aqui.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/feed/novo"
            className="inline-flex min-h-11 items-center rounded-full bg-destaque px-5 text-sm font-semibold text-white hover:bg-destaque/90"
          >
            Publicar
          </Link>
          <Link
            href="/pessoas"
            className="inline-flex min-h-11 items-center rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
          >
            Encontrar pessoas
          </Link>
        </div>
        <MarcarVistas />
      </div>
    );
  }

  return (
    <>
      <MarcarVistas />
      <ol className="flex flex-col gap-2">
        {grupos.map((g) => {
          const pessoas = g.atores
            .map((id) => perfilDe.get(id))
            .filter((p) => p !== undefined);
          if (pessoas.length === 0) return null;
          const nomes = pessoas.map((p) => p.nome_exibicao ?? p.nome_usuario);
          const foto = g.post_id ? fotoDe.get(g.post_id) : null;
          return (
            <li key={g.chave}>
              <Link
                href={destino(g, pessoas[0].nome_usuario)}
                className={`flex items-center gap-3 rounded-2xl border p-3 hover:border-destaque/60 ${
                  g.novo
                    ? "border-destaque/40 bg-destaque/5"
                    : "border-borda bg-superficie"
                }`}
              >
                <AvatarPerfil
                  perfil={pessoas[0]}
                  tamanho="44px"
                  className="size-11 shrink-0"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 text-sm">
                    {g.novo ? <span className="sr-only">Nova: </span> : null}
                    {frase(g, nomes)}
                  </span>
                  <span className="text-xs text-texto-apagado">
                    {tempoDesde(g.criado_em)}
                  </span>
                </span>
                {foto ? (
                  <FotoAssinada
                    chave={foto}
                    alt=""
                    sizes="48px"
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : null}
                {g.novo ? (
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full bg-destaque"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function destino(g: Grupo, primeiroUsuario: string): string {
  if (g.tipo === "seguidor") {
    return g.atores.length === 1 ? `/u/${primeiroUsuario}` : "/pessoas";
  }
  return g.tipo === "comentario"
    ? `/feed/p/${g.post_id}#comentarios`
    : `/feed/p/${g.post_id}`;
}
