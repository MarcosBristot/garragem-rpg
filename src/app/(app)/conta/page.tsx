import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { FotoAssinada } from "@/components/foto-assinada";
import { SilhuetaCarro } from "@/components/silhueta-carro";
import { nomeDoCarro } from "@/lib/carros";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Seu perfil · LifeInGears" };

// Seu perfil como os outros veem, mais os números que só você vê (quantos
// te seguem). Editar fica em Configurações. aceiteOpcional: quem ainda não
// aceitou os termos novos consegue chegar às Configurações (baixar dados,
// excluir a conta).

const botao =
  "inline-flex min-h-11 items-center justify-center rounded-md px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaPerfil() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pb-10"
    >
      <Suspense fallback={<EsqueletoPerfil />}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

function EsqueletoPerfil() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando seu perfil"
      className="animate-pulse"
    >
      <div className="-mx-4 h-36 bg-superficie-2 sm:mx-0 sm:mt-6 sm:rounded-3xl" />
      <div className="-mt-12 ml-2 size-28 rounded-md border-4 border-fundo bg-borda" />
      <div className="mt-4 h-8 w-48 rounded bg-borda" />
    </div>
  );
}

async function Conteudo() {
  const { supabase, perfil } = await exigirPerfil({ aceiteOpcional: true });
  const nome = perfil.nome_exibicao ?? perfil.nome_usuario;

  const contar = (consulta: PromiseLike<{ count: number | null }>) =>
    consulta.then((r) => r.count ?? 0);
  const [carros, posts, totalPosts, seguidores, seguindo] = await Promise.all([
    supabase
      .from("carros")
      .select("id, apelido, marca, modelo, ano, foto_capa, publico")
      .eq("dono_id", perfil.id)
      .order("criado_em")
      .then((r) => r.data ?? []),
    supabase
      .from("posts")
      .select("id, legenda, fotos_post!inner (chave)")
      .eq("dono_id", perfil.id)
      .order("criado_em", { ascending: false })
      .order("criado_em", { referencedTable: "fotos_post", ascending: true })
      .limit(1, { referencedTable: "fotos_post" })
      .limit(12)
      .then((r) => r.data ?? []),
    contar(
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("dono_id", perfil.id),
    ),
    contar(
      supabase
        .from("seguidores")
        .select("seguidor_id", { count: "exact", head: true })
        .eq("seguido_id", perfil.id),
    ),
    contar(
      supabase
        .from("seguidores")
        .select("seguido_id", { count: "exact", head: true })
        .eq("seguidor_id", perfil.id),
    ),
  ]);

  const numeros = [
    {
      rotulo: carros.length === 1 ? "carro" : "carros",
      valor: carros.length,
      href: "/garagem",
    },
    {
      rotulo: totalPosts === 1 ? "post" : "posts",
      valor: totalPosts,
      href: "#posts",
    },
    {
      rotulo: seguidores === 1 ? "seguidor" : "seguidores",
      valor: seguidores,
      href: null,
    },
    { rotulo: "seguindo", valor: seguindo, href: "/pessoas" },
  ];

  return (
    <>
      <section aria-labelledby="titulo-perfil">
        <div
          aria-hidden="true"
          className="-mx-4 h-36 fundo-capa sm:mx-0 sm:mt-6 sm:rounded-3xl"
        />
        <div className="-mt-14 flex flex-col gap-4 px-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <AvatarPerfil
              perfil={perfil}
              rotulo={`Foto de ${nome}`}
              tamanho="112px"
              className="size-28 shrink-0 border-4 border-fundo"
            />
            <div className="min-w-0 pb-1">
              <h1 id="titulo-perfil" className="truncate text-4xl">
                {nome}
              </h1>
              <p className="truncate text-sm text-texto-secundario">
                @{perfil.nome_usuario}
                {perfil.cidade ? ` · ${perfil.cidade}` : null}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/conta/configuracoes"
              className={`${botao} bg-destaque text-white hover:bg-destaque/90`}
            >
              Editar perfil
            </Link>
            <Link
              href={`/u/${perfil.nome_usuario}`}
              className={`${botao} border border-borda hover:bg-borda/50`}
            >
              Ver como os outros veem
            </Link>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-4 gap-2 text-center">
          {numeros.map((n) => {
            const corpo = (
              <>
                <span className="block font-titulo text-3xl">{n.valor}</span>
                <span className="block text-xs text-texto-secundario">
                  {n.rotulo}
                </span>
              </>
            );
            return (
              <li key={n.rotulo}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className="block rounded-2xl py-2 hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-destaque"
                  >
                    {corpo}
                  </Link>
                ) : (
                  <div className="py-2">{corpo}</div>
                )}
              </li>
            );
          })}
        </ul>
        {!perfil.foto || !perfil.cidade ? (
          <p className="mt-4 rounded-2xl border border-borda bg-superficie-2 p-4 text-sm text-texto-secundario">
            Complete seu perfil:{" "}
            {[
              !perfil.foto && "uma foto",
              !perfil.cidade && "sua cidade (para o ranking)",
            ]
              .filter(Boolean)
              .join(" e ")}
            .{" "}
            <Link
              href="/conta/configuracoes"
              className="font-semibold text-destaque underline"
            >
              Completar
            </Link>
          </p>
        ) : null}
      </section>

      <section
        id="posts"
        aria-labelledby="titulo-posts"
        className="flex scroll-mt-20 flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-posts" className="text-3xl">
            Seus posts
          </h2>
          <Link
            href="/feed/novo"
            className="text-sm font-semibold text-destaque hover:underline"
          >
            Publicar
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center">
            <p className="text-texto-secundario">
              Você ainda não publicou. Mostre seu carro para a galera!
            </p>
            <Link
              href="/feed/novo"
              className={`${botao} bg-destaque text-white hover:bg-destaque/90`}
            >
              Publicar a primeira foto
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-1 overflow-hidden rounded-2xl">
            {posts.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/feed/p/${p.id}`}
                  className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
                >
                  <FotoAssinada
                    chave={p.fotos_post[0].chave}
                    alt={
                      p.legenda
                        ? `Post: ${p.legenda.slice(0, 80)}`
                        : "Abrir post"
                    }
                    sizes="(min-width: 768px) 250px, 33vw"
                    className="aspect-square w-full object-cover transition-opacity hover:opacity-90"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="titulo-carros" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-carros" className="text-3xl">
            Seus carros
          </h2>
          <Link
            href="/garagem/carros/novo"
            className="text-sm font-semibold text-destaque hover:underline"
          >
            Adicionar
          </Link>
        </div>
        {carros.length === 0 ? (
          <p className="text-texto-secundario">
            Nenhum carro ainda.{" "}
            <Link
              href="/garagem/carros/novo"
              className="font-semibold text-destaque underline"
            >
              Cadastre o seu
            </Link>{" "}
            para começar o diário e ganhar XP.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {carros.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/garagem/carros/${c.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-borda bg-superficie p-3 hover:border-destaque/60"
                >
                  <div className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl fundo-vitrine">
                    {c.foto_capa ? (
                      <FotoAssinada
                        chave={c.foto_capa}
                        alt=""
                        sizes="64px"
                        className="absolute inset-0 size-full object-cover"
                      />
                    ) : (
                      <SilhuetaCarro className="w-4/5 text-destaque" />
                    )}
                  </div>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold">
                      {nomeDoCarro(c)}
                    </span>
                    <span className="truncate text-sm text-texto-secundario">
                      {[c.marca, c.modelo, c.ano].filter(Boolean).join(" · ")}
                      {c.publico ? "" : " · privado"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-texto-secundario">
        Só você vê quantas pessoas te seguem.{" "}
        <Link
          href="/conta/configuracoes"
          className="underline hover:text-texto"
        >
          Configurações
        </Link>
        : foto, nome, cidade, personagem, bloqueios, seus dados e sair.
      </p>
    </>
  );
}
