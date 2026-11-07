import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapaVer } from "@/components/mapa/mapa-ver";
import { jaComecou, quandoEncontro, TIPOS_ENCONTRO } from "@/dominio/encontro";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Mapa · LifeInGears" };

// Encontros que ainda não terminaram. Quem pode ver (conta, bloqueios) é a
// RLS que decide; de quem vai, só o total (resumo_encontros).

const botao =
  "inline-flex min-h-11 items-center justify-center rounded-md border-2 border-texto bg-destaque sombra-botao px-5 text-sm font-semibold text-white hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaMapa() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">Encontros</h1>
          <p className="text-texto-secundario">
            Encontros, rolês e track days marcados pela galera.
          </p>
        </div>
        <Link href="/mapa/novo" className={botao}>
          Criar encontro
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="h-80 rounded-3xl bg-superficie-2 motion-safe:animate-pulse" />
        }
      >
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  const { supabase } = await exigirPerfil();
  const { data, error } = await supabase
    .from("encontros")
    .select("id, titulo, tipo, local_nome, cidade, lat, lng, inicio, fim")
    .gt("fim", new Date().toISOString())
    .order("inicio")
    .limit(200);
  if (error) throw new Error(`Encontros: ${error.code}`);
  const encontros = data.map((e) => ({
    ...e,
    lat: Number(e.lat),
    lng: Number(e.lng),
  }));
  const { data: resumo } = encontros.length
    ? await supabase.rpc("resumo_encontros", {
        p_ids: encontros.map((e) => e.id),
      })
    : { data: [] };
  const deEncontro = new Map((resumo ?? []).map((r) => [r.encontro_id, r]));

  return (
    <>
      <div className="h-80 overflow-hidden rounded-3xl border border-borda sm:h-[28rem]">
        <MapaVer
          encontros={encontros}
          zoomMaximo={10}
          rotulo="Mapa dos próximos encontros (a lista abaixo tem os mesmos encontros)"
        />
      </div>

      <section
        aria-labelledby="titulo-proximos"
        className="flex flex-col gap-3"
      >
        <h2 id="titulo-proximos" className="text-3xl">
          Próximos encontros
        </h2>
        {encontros.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center">
            <p className="text-texto-secundario">
              Nenhum encontro marcado ainda. Que tal chamar a galera?
            </p>
            <Link href="/mapa/novo" className={botao}>
              Criar o primeiro encontro
            </Link>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {encontros.map((e) => {
              const r = deEncontro.get(e.id);
              const acontecendo = jaComecou(e.inicio);
              return (
                <li key={e.id}>
                  <Link
                    href={`/mapa/${e.id}`}
                    className="flex h-full flex-col gap-1 rounded-2xl border border-borda bg-superficie p-4 hover:border-destaque/60"
                  >
                    <span className="rotulo text-[0.65rem]">
                      {acontecendo ? (
                        <span className="text-condicao">
                          Acontecendo agora ·{" "}
                        </span>
                      ) : null}
                      {TIPOS_ENCONTRO[e.tipo as keyof typeof TIPOS_ENCONTRO] ??
                        e.tipo}
                    </span>
                    <span className="font-semibold">{e.titulo}</span>
                    <span className="text-sm text-texto-secundario">
                      {quandoEncontro(e.inicio)}
                    </span>
                    <span className="text-sm text-texto-secundario">
                      {e.local_nome}
                      {e.cidade ? ` · ${e.cidade}` : ""}
                    </span>
                    <span className="mt-1 text-sm">
                      {r?.vao ?? 0} {(r?.vao ?? 0) === 1 ? "vai" : "vão"}
                      {r?.eu_vou ? (
                        <span className="font-semibold text-destaque">
                          {" "}
                          · você vai
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
