import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SilhuetaCarro } from "@/components/silhueta-carro";
import { nomeDoCarro } from "@/lib/carros";
import { formatarData } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Minha garagem · Garagem RPG" };

const estiloLinkPrimario =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-destaque px-5 text-sm font-semibold text-fundo hover:bg-destaque/90";

export default function PaginaGaragem() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 pb-10"
    >
      <Suspense
        fallback={<p className="pt-10 text-texto-secundario">Carregando…</p>}
      >
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
  const { data } = await supabase
    .from("carros")
    .select("id, marca, modelo, ano, apelido, publico, registros(data)")
    .eq("dono_id", perfil.id)
    .order("criado_em");
  const carros = data ?? [];
  const totalRegistros = carros.reduce((n, c) => n + c.registros.length, 0);
  const nome = perfil.nome_exibicao ?? perfil.nome_usuario;

  return (
    <>
      {/* Cabeçalho de perfil, no estilo de rede social. */}
      <section aria-labelledby="titulo-perfil" className="flex flex-col">
        <div
          aria-hidden="true"
          className="-mx-4 h-36 bg-[radial-gradient(ellipse_at_70%_120%,rgb(245_165_36/0.35),transparent_60%),linear-gradient(to_bottom,#16171b,#0b0b0d)] sm:mx-0 sm:mt-6 sm:h-44 sm:rounded-3xl"
        />
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4 px-2">
          <div className="flex items-end gap-4">
            <span
              aria-hidden="true"
              className="grid size-24 place-items-center rounded-full border-4 border-fundo bg-superficie-2 font-titulo text-5xl text-destaque uppercase"
            >
              {nome.charAt(0)}
            </span>
            <div className="pb-1">
              <h1 id="titulo-perfil" className="text-4xl">
                {nome}
              </h1>
              <p className="text-sm text-texto-secundario">
                @{perfil.nome_usuario}
                {perfil.cidade ? ` · ${perfil.cidade}` : null}
              </p>
            </div>
          </div>
          <Link href="/garagem/carros/novo" className={estiloLinkPrimario}>
            <span aria-hidden="true">+</span> Novo carro
          </Link>
        </div>
        <dl className="mt-6 flex gap-8 px-2">
          {/* dt antes de dd (HTML válido); flex-col-reverse põe o número em cima. */}
          <div className="flex flex-col-reverse">
            <dt className="rotulo">
              {carros.length === 1 ? "Carro" : "Carros"}
            </dt>
            <dd className="font-titulo text-3xl">{carros.length}</dd>
          </div>
          <div className="flex flex-col-reverse">
            <dt className="rotulo">
              {totalRegistros === 1 ? "Registro" : "Registros"}
            </dt>
            <dd className="font-titulo text-3xl">{totalRegistros}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="titulo-carros" className="flex flex-col gap-4">
        <h2 id="titulo-carros" className="text-3xl">
          Garagem
        </h2>

        {carros.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {carros.map((carro) => {
              const ultimo = carro.registros
                .map((r) => r.data)
                .sort()
                .at(-1);
              return (
                <li key={carro.id}>
                  {/* O cartão inteiro é o link: alvo de toque grande. */}
                  <Link
                    href={`/garagem/carros/${carro.id}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-borda bg-superficie transition-colors hover:border-destaque/60"
                  >
                    <div className="relative grid h-40 place-items-center bg-[radial-gradient(ellipse_at_50%_100%,rgb(245_165_36/0.18),transparent_70%)]">
                      <SilhuetaCarro className="w-4/5 text-destaque transition-transform duration-500 group-hover:translate-x-2" />
                      <span className="rotulo absolute top-4 left-4 rounded-full bg-fundo/70 px-3 py-1 text-[0.65rem]">
                        {carro.publico ? "Público" : "Privado"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 p-5">
                      <span className="font-titulo text-3xl">
                        {nomeDoCarro(carro)}
                      </span>
                      <span className="rotulo">
                        {[carro.marca, carro.modelo, carro.ano]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                      <span className="mt-2 text-sm text-texto-secundario">
                        {carro.registros.length}{" "}
                        {carro.registros.length === 1
                          ? "registro"
                          : "registros"}
                        {ultimo ? ` · último em ${formatarData(ultimo)}` : null}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-borda bg-superficie p-10 text-center">
            <SilhuetaCarro className="w-48 text-texto-apagado" />
            <p className="font-titulo text-3xl">Sua garagem está vazia</p>
            <p className="text-texto-secundario">
              Cadastre seu carro para começar o diário.
            </p>
            <Link href="/garagem/carros/novo" className={estiloLinkPrimario}>
              <span aria-hidden="true">+</span> Adicionar carro
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
