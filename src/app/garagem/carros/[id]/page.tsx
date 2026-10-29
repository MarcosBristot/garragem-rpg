import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TIPOS, VISIBILIDADES } from "@/dominio/registro";
import { carroDoDonoOu404, nomeDoCarro } from "@/lib/carros";
import { formatarData } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Diário do carro · Garagem RPG" };

const estiloLinkPrimario =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-destaque px-4 font-semibold text-fundo hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";
const estiloLinkSecundario =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-borda px-4 text-sm font-semibold hover:bg-borda/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaCarro({
  params,
}: PageProps<"/garagem/carros/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link
        href="/garagem"
        className="inline-flex min-h-11 w-fit items-center text-sm text-texto-secundario hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque"
      >
        ← Minha garagem
      </Link>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        {params.then(({ id }) => (
          <Conteudo carroId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({ carroId }: { carroId: string }) {
  const { supabase, perfil } = await exigirPerfil();
  const carro = await carroDoDonoOu404(supabase, perfil.id, carroId);

  const { data: registros } = await supabase
    .from("registros")
    .select("id, tipo, titulo, data, km, visibilidade")
    .eq("carro_id", carro.id)
    .eq("dono_id", perfil.id)
    .order("data", { ascending: false })
    .order("criado_em", { ascending: false });

  const novoRegistro = `/garagem/carros/${carro.id}/registros/novo`;

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{nomeDoCarro(carro)}</h1>
          <p className="text-texto-secundario">
            {[carro.marca, carro.modelo, carro.ano].filter(Boolean).join(" · ")}
            {" · "}
            {carro.publico ? "Público" : "Privado"}
          </p>
        </div>
        <Link
          href={`/garagem/carros/${carro.id}/editar`}
          className={estiloLinkSecundario}
        >
          Editar carro
        </Link>
      </header>

      <section aria-labelledby="titulo-diario" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="titulo-diario" className="text-xl font-bold">
            Diário
          </h2>
          {registros && registros.length > 0 ? (
            <Link href={novoRegistro} className={estiloLinkPrimario}>
              Novo registro
            </Link>
          ) : null}
        </div>

        {registros && registros.length > 0 ? (
          <ol className="flex flex-col gap-3">
            {registros.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-borda bg-superficie p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.titulo}</p>
                  <p className="text-sm text-texto-secundario">
                    <time dateTime={r.data}>{formatarData(r.data)}</time>
                    {" · "}
                    {TIPOS[r.tipo]}
                    {r.km !== null
                      ? ` · ${r.km.toLocaleString("pt-BR")} km`
                      : null}
                    {" · "}
                    {VISIBILIDADES[r.visibilidade].rotulo}
                  </p>
                </div>
                <Link
                  href={`/garagem/carros/${carro.id}/registros/${r.id}/editar`}
                  aria-label={`Editar ${r.titulo}`}
                  className={estiloLinkSecundario}
                >
                  Editar
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-borda bg-superficie p-8 text-center">
            <p className="text-texto-secundario">
              Nenhum registro ainda. Comece pela última manutenção que você
              lembra.
            </p>
            <Link href={novoRegistro} className={estiloLinkPrimario}>
              Novo registro
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
