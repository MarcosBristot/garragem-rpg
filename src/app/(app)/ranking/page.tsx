import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Selecao } from "@/components/formulario";
import { CLASSES, ehClasse, type Classe } from "@/dominio/classe";
import { lerFiltros, rotuloPosicao, type Onde } from "@/dominio/ranking";
import { nomeDoCarro } from "@/lib/carros";
import { exigirPerfil } from "@/lib/sessao";

export const metadata: Metadata = { title: "Ranking · Garagem RPG" };

// Liga = classe do carro; pontuação = XP ganho no mês (zera todo dia 1º).
// Quem entra, quem vê e os bloqueios são decididos no banco
// (public.ranking_mensal); aqui só escolhemos os filtros e mostramos.

const ONDE: Record<Onde, string> = {
  cidade: "Minha cidade",
  brasil: "Brasil",
};

const estiloBotao =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-destaque px-4 font-semibold text-white hover:bg-destaque/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque";

export default function PaginaRanking({ searchParams }: PageProps<"/ranking">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl">Ranking do mês</h1>
        <p className="text-texto-secundario">
          Carros da mesma classe, pelo XP ganho este mês cuidando do carro. Zera
          todo dia 1º. Dinheiro gasto não conta.
        </p>
      </div>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        {searchParams.then((p) => (
          <Conteudo params={p} />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const { supabase, perfil } = await exigirPerfil();

  // Classe padrão: a de um carro seu que já tenha classe; senão, hatch.
  const { data: meus } = await supabase
    .from("carros")
    .select("id, classe, publico")
    .eq("dono_id", perfil.id);
  const minhaClasse = (meus ?? []).find((c) => ehClasse(c.classe))?.classe;
  const padrao: Classe = ehClasse(minhaClasse) ? minhaClasse : "hatch";
  const { classe, onde } = lerFiltros(params, padrao);
  const semClasse = (meus ?? []).some((c) => c.publico && !c.classe);
  const semCidade = onde === "cidade" && !perfil.cidade?.trim();

  const { data: linhas, error } = semCidade
    ? { data: [], error: null }
    : await supabase.rpc("ranking_mensal", {
        p_classe: classe,
        ...(onde === "cidade" ? { p_cidade: perfil.cidade ?? "" } : {}),
      });
  // Erro não pode virar "ninguém no ranking": deixa estourar.
  if (error) throw new Error(`Ranking: ${error.code} ${error.message}`);

  return (
    <>
      {/* GET simples: funciona sem JavaScript e o link pode ser compartilhado. */}
      <form
        method="get"
        className="grid gap-4 rounded-2xl border border-borda bg-superficie p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <Selecao
          id="classe"
          name="classe"
          rotulo="Liga (classe)"
          opcoes={CLASSES}
          defaultValue={classe}
        />
        <Selecao
          id="onde"
          name="onde"
          rotulo="Onde"
          opcoes={ONDE}
          defaultValue={onde}
        />
        <button type="submit" className={estiloBotao}>
          Ver
        </button>
      </form>

      {semClasse ? (
        <p className="rounded-2xl border border-borda bg-superficie-2 p-4 text-sm text-texto-secundario">
          Algum carro seu ainda não tem classe e fica fora do ranking. Escolha a
          classe em{" "}
          <Link
            href="/garagem"
            className="font-semibold text-destaque underline"
          >
            Garagem
          </Link>{" "}
          → carro → Editar.
        </p>
      ) : null}

      {semCidade ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center">
          <p className="text-texto-secundario">
            Para ver o ranking da sua cidade, informe a cidade no seu perfil. Só
            a cidade: nunca o endereço.
          </p>
          <Link href="/conta/configuracoes" className={estiloBotao}>
            Informar minha cidade
          </Link>
        </div>
      ) : linhas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-borda bg-superficie p-8 text-center text-texto-secundario">
          Ninguém da liga {CLASSES[classe]}{" "}
          {onde === "cidade" ? "na sua cidade" : "no Brasil"} ganhou XP este
          mês. Registre uma manutenção e saia na frente!
        </div>
      ) : (
        <ol
          className="flex flex-col gap-3"
          aria-label={`Ranking ${CLASSES[classe]}`}
        >
          {linhas.map((l) => {
            const meu = l.nome_usuario === perfil.nome_usuario;
            return (
              <li
                key={l.carro_id}
                className={`flex items-center gap-4 rounded-2xl border p-4 ${
                  meu
                    ? "border-destaque bg-destaque/5"
                    : "border-borda bg-superficie"
                }`}
              >
                <span
                  className={`font-titulo w-12 shrink-0 text-center text-3xl ${
                    l.posicao <= 3 ? "text-destaque" : "text-texto-secundario"
                  }`}
                >
                  {rotuloPosicao(l.posicao)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/c/${l.carro_id}`}
                    className="truncate font-semibold hover:underline"
                  >
                    {nomeDoCarro(l)}
                  </Link>
                  <span className="truncate text-sm text-texto-secundario">
                    <Link
                      href={`/u/${l.nome_usuario}`}
                      className="hover:underline"
                    >
                      @{l.nome_usuario}
                    </Link>
                    {l.cidade ? ` · ${l.cidade}` : ""}
                    {meu ? " · você" : ""}
                  </span>
                </div>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-semibold">
                    {l.xp_mes}
                  </span>
                  <span className="rotulo text-[0.6rem]">XP no mês</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
