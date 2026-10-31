import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CabecalhoPublico } from "@/components/cabecalho-publico";
import { FotoAssinada } from "@/components/foto-assinada";
import { SilhuetaCarro } from "@/components/silhueta-carro";
import { formatarReais } from "@/dominio/dinheiro";
import { CATEGORIAS } from "@/dominio/item";
import { TIPOS } from "@/dominio/registro";
import { nomeDoCarro } from "@/lib/carros";
import { formatarData } from "@/lib/datas";
import { carroPublico, diarioPublico } from "@/lib/publico";

// Página pública do carro. Só existe se o carro for público; mostra só
// registros não privados (views do banco). Notas nunca aparecem aqui.

export async function generateMetadata({
  params,
}: PageProps<"/c/[id]">): Promise<Metadata> {
  const { id } = await params;
  const dados = await carroPublico(id);
  if (!dados) return { title: "Página não encontrada · Garagem RPG" };
  const nome = nomeDoCarro(dados.carro);
  const descricao = `${[dados.carro.marca, dados.carro.modelo, dados.carro.ano].filter(Boolean).join(" · ")} — garagem de @${dados.dono.nome_usuario} no Garagem RPG.`;
  return {
    title: `${nome} · Garagem RPG`,
    description: descricao,
    openGraph: { title: nome, description: descricao, type: "website" },
  };
}

export default function PaginaCarroPublico({ params }: PageProps<"/c/[id]">) {
  return (
    <>
      <CabecalhoPublico />
      <main
        id="conteudo"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10"
      >
        <Suspense
          fallback={<p className="text-texto-secundario">Carregando…</p>}
        >
          {params.then(({ id }) => (
            <Conteudo id={id} />
          ))}
        </Suspense>
      </main>
    </>
  );
}

async function Conteudo({ id }: { id: string }) {
  const dados = await carroPublico(id);
  if (!dados) notFound();
  const { carro, dono } = dados;
  const diario = await diarioPublico(carro.id);
  const nome = nomeDoCarro(carro);

  return (
    <>
      <header className="flex flex-col gap-4">
        {carro.foto_capa ? (
          <FotoAssinada
            chave={carro.foto_capa}
            alt={`Foto de ${nome}`}
            sizes="(min-width: 768px) 736px, 92vw"
            className="aspect-video w-full rounded-3xl border border-borda object-cover"
            prioridade
          />
        ) : (
          <div className="grid h-52 place-items-center rounded-3xl border border-borda bg-[radial-gradient(ellipse_at_50%_100%,rgb(245_165_36/0.22),transparent_70%)]">
            <SilhuetaCarro className="w-3/4 max-w-md text-destaque" />
          </div>
        )}
        <div>
          <p className="rotulo">
            {[carro.marca, carro.modelo, carro.ano].filter(Boolean).join(" · ")}
          </p>
          <h1 className="text-6xl">{nome}</h1>
          <p className="mt-1 text-texto-secundario">
            Garagem de{" "}
            <Link
              href={`/u/${dono.nome_usuario}`}
              className="text-destaque underline"
            >
              @{dono.nome_usuario}
            </Link>
            {dono.cidade ? ` · ${dono.cidade}` : null}
          </p>
          <a
            href={`/c/${carro.id}/card`}
            download
            className="mt-4 inline-flex min-h-11 items-center rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
          >
            Baixar card para stories
          </a>
        </div>
      </header>

      <section aria-labelledby="titulo-diario" className="flex flex-col gap-4">
        <h2 id="titulo-diario" className="text-4xl">
          Diário{" "}
          <span className="font-sans text-base text-texto-secundario">
            {diario.length}{" "}
            {diario.length === 1 ? "registro público" : "registros públicos"}
          </span>
        </h2>
        {diario.length === 0 ? (
          <p className="text-texto-secundario">
            Nenhum registro público ainda.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {diario.map((r) => {
              const comValor = r.itens.filter((i) => i.valor_centavos !== null);
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5"
                >
                  <div>
                    <p className="text-sm text-texto-secundario">
                      {r.data ? (
                        <time dateTime={r.data}>{formatarData(r.data)}</time>
                      ) : null}
                      {r.tipo ? ` · ${TIPOS[r.tipo]}` : null}
                      {r.km !== null
                        ? ` · ${r.km.toLocaleString("pt-BR")} km`
                        : null}
                    </p>
                    <h3 className="text-lg font-semibold">{r.titulo}</h3>
                  </div>
                  {r.fotos.length > 0 ? (
                    <ul className="grid grid-cols-3 gap-2">
                      {r.fotos.map((f, i) => (
                        <li key={f.id}>
                          {f.chave ? (
                            <FotoAssinada
                              chave={f.chave}
                              alt={
                                f.descricao ?? `Foto ${i + 1} de ${r.titulo}`
                              }
                              sizes="(min-width: 768px) 230px, 30vw"
                              className="aspect-square w-full rounded-xl object-cover"
                            />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {r.itens.length > 0 ? (
                    <ul className="flex flex-col gap-1 text-sm">
                      {r.itens.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3">
                          <span>
                            {i.descricao}{" "}
                            <span className="text-texto-secundario">
                              ·{" "}
                              {CATEGORIAS[
                                i.categoria as keyof typeof CATEGORIAS
                              ] ?? i.categoria}
                            </span>
                          </span>
                          {i.valor_centavos !== null ? (
                            <span>{formatarReais(i.valor_centavos)}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {comValor.length > 0 ? (
                    <p className="text-right text-sm font-semibold">
                      Total:{" "}
                      {formatarReais(
                        comValor.reduce(
                          (s, i) => s + (i.valor_centavos ?? 0),
                          0,
                        ),
                      )}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}
