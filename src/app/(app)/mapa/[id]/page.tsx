import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { Botao } from "@/components/formulario";
import { MapaVer } from "@/components/mapa/mapa-ver";
import {
  jaTerminou,
  linkComoChegar,
  quandoEncontro,
  TIPOS_ENCONTRO,
} from "@/dominio/encontro";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { alternarPresenca } from "../acoes";

export const metadata: Metadata = { title: "Encontro · LifeInGears" };

const estiloLink =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-borda px-5 text-sm font-semibold hover:bg-borda/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaEncontro({
  params,
  searchParams,
}: PageProps<"/mapa/[id]">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8"
    >
      <Link
        href="/mapa"
        className="inline-flex min-h-11 items-center self-start text-sm text-texto-secundario hover:text-texto"
      >
        ← Todos os encontros
      </Link>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        {Promise.all([params, searchParams]).then(([{ id }, p]) => (
          <Conteudo id={id} acabouDeCriar={p.novo === "1"} />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({
  id,
  acabouDeCriar,
}: {
  id: string;
  acabouDeCriar: boolean;
}) {
  const { supabase, perfil } = await exigirPerfil();
  if (!ehUuid(id)) notFound();
  const { data: e } = await supabase
    .from("encontros")
    .select(
      "id, titulo, tipo, descricao, local_nome, cidade, lat, lng, inicio, fim, organizador_id, perfis!encontros_organizador_id_fkey (id, nome_usuario, nome_exibicao, personagem, foto)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();
  const { data: resumo } = await supabase.rpc("resumo_encontros", {
    p_ids: [e.id],
  });
  const vao = resumo?.[0]?.vao ?? 0;
  const euVou = resumo?.[0]?.eu_vou ?? false;
  const lat = Number(e.lat);
  const lng = Number(e.lng);
  const meu = e.organizador_id === perfil.id;
  const terminou = jaTerminou(e.fim);
  const org = e.perfis;

  return (
    <article className="flex flex-col gap-6">
      {acabouDeCriar ? (
        <p
          role="status"
          className="rounded-2xl border border-destaque/30 bg-destaque/5 p-4 text-sm"
        >
          <strong>Encontro criado!</strong> Ele já aparece no mapa. Divulgue
          para a galera: quem tem conta encontra em Mapa.
        </p>
      ) : null}

      <header className="flex flex-col gap-2">
        <p className="rotulo">
          {TIPOS_ENCONTRO[e.tipo as keyof typeof TIPOS_ENCONTRO] ?? e.tipo}
        </p>
        <h1 className="text-5xl">{e.titulo}</h1>
        <p className="text-lg">
          <time dateTime={e.inicio}>{quandoEncontro(e.inicio)}</time>
          <span className="text-texto-secundario">
            {" "}
            até <time dateTime={e.fim}>{quandoEncontro(e.fim)}</time>
          </span>
        </p>
        <p className="text-texto-secundario">
          {e.local_nome}
          {e.cidade ? ` · ${e.cidade}` : ""}
        </p>
      </header>

      <div className="h-64 overflow-hidden rounded-3xl border border-borda">
        <MapaVer
          encontros={[
            {
              id: e.id,
              titulo: e.titulo,
              lat,
              lng,
              inicio: e.inicio,
              local_nome: e.local_nome,
            },
          ]}
          rotulo={`Mapa do ponto de encontro: ${e.local_nome}`}
          zoomMaximo={15}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {terminou ? (
          <p className="text-texto-secundario">Este encontro já terminou.</p>
        ) : (
          <form action={alternarPresenca.bind(null, e.id, !euVou)}>
            <Botao type="submit" variante={euVou ? "secundario" : "primario"}>
              {euVou ? "Você vai ✓ (desistir)" : "Eu vou"}
            </Botao>
          </form>
        )}
        <p className="text-sm">
          <strong>{vao}</strong> {vao === 1 ? "pessoa vai" : "pessoas vão"}
        </p>
        <a
          href={linkComoChegar(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          className={estiloLink}
        >
          Como chegar ↗
        </a>
      </div>

      {e.descricao ? (
        <p className="whitespace-pre-line">{e.descricao}</p>
      ) : null}

      {org ? (
        <section
          aria-labelledby="titulo-org"
          className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <AvatarPerfil
            perfil={org}
            tamanho="44px"
            className="size-11 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2 id="titulo-org" className="rotulo font-sans text-[0.65rem]">
              Organizado por
            </h2>
            <Link
              href={`/u/${org.nome_usuario}`}
              className="font-semibold hover:underline"
            >
              {org.nome_exibicao ?? org.nome_usuario}
            </Link>
          </div>
          {meu ? (
            <Link href={`/mapa/${e.id}/editar`} className={estiloLink}>
              Editar
            </Link>
          ) : null}
        </section>
      ) : null}

      <p className="border-t border-borda pt-4 text-sm text-texto-secundario">
        De quem vai, só o número aparece: ninguém fica sabendo que você estará
        aqui.{" "}
        {meu ? null : (
          <Link
            href={`/denunciar?tipo=encontro&id=${e.id}`}
            className="underline hover:text-texto"
          >
            Denunciar este encontro
          </Link>
        )}
      </p>
    </article>
  );
}
