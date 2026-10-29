import type { Metadata } from "next";
import Link from "next/link";
import { CenaFundo } from "@/components/landing/cena-fundo";
import { Revelar } from "@/components/landing/revelar";
import { Marca } from "@/components/marca";
import { SilhuetaCarro } from "@/components/silhueta-carro";

export const metadata: Metadata = {
  title: "Garagem RPG · O diário do seu carro vira ficha de RPG",
  description:
    "Registre manutenções e modificações, acompanhe a história do carro e, em breve, transforme o diário em uma ficha de RPG para compartilhar.",
};

// Página pública e 100% estática: o texto vem pronto do servidor e o 3D
// carrega por cima, depois. Regras de honestidade (CLAUDE.md):
// - nada de depoimentos, números de usuários ou avaliações inventadas;
// - o que ainda não existe aparece marcado como "em breve" / "exemplo".

const ctaPrimario =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-destaque px-7 text-sm font-semibold tracking-[0.15em] text-fundo uppercase hover:bg-destaque/90";
const ctaSecundario =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-texto/30 bg-fundo/40 px-7 text-sm font-semibold tracking-[0.15em] uppercase backdrop-blur hover:bg-texto/10";
const painel =
  "rounded-3xl border border-borda bg-fundo/75 p-6 backdrop-blur-md sm:p-8";

function Selo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rotulo inline-block rounded-full border border-destaque/50 px-3 py-1 text-[0.65rem] text-destaque">
      {children}
    </span>
  );
}

// Valores de exemplo da ficha, rotulados como ilustrativos na tela.
const ATRIBUTOS_EXEMPLO = [
  { nome: "Potência", valor: 62 },
  { nome: "Estilo", valor: 78 },
  { nome: "Engenhosidade", valor: 54 },
  { nome: "Dedicação", valor: 85 },
];

function Barra({
  nome,
  valor,
  cor = "bg-destaque",
}: {
  nome: string;
  valor: number;
  cor?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span>{nome}</span>
        <span className="text-texto-secundario">{valor}</span>
      </div>
      <div
        role="meter"
        aria-label={`${nome} (exemplo)`}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-full bg-borda"
      >
        <div
          className={`h-full rounded-full ${cor}`}
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

export default function PaginaInicial() {
  return (
    <>
      <CenaFundo />

      <header className="fixed inset-x-0 top-0 z-30 bg-gradient-to-b from-fundo/90 to-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <Marca />
          <nav aria-label="Conta">
            <Link
              href="/entrar"
              className="inline-flex min-h-11 items-center px-3 text-sm font-semibold tracking-[0.15em] uppercase"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="relative">
        {/* Abertura: título no alto, carro de frente embaixo (como no Forge). */}
        <section className="flex min-h-svh flex-col items-center px-4 pt-28 text-center sm:pt-32">
          <p className="rotulo">Diário · Ficha de RPG · Comunidade</p>
          <h1 className="mt-5 text-6xl sm:text-8xl">
            Seu carro tem história.
            <br />
            <em className="text-destaque">Conte cada capítulo.</em>
          </h1>
          <p className="mt-6 max-w-xl rounded-2xl bg-fundo/70 px-3 py-2 text-texto-secundario backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none">
            Garagem RPG é a rede social de quem vive o próprio carro: um diário
            de manutenção e modificações que dá vida à ficha do seu carro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/entrar" className={ctaPrimario}>
              Criar minha garagem
            </Link>
            <a href="#o-que-e" className={ctaSecundario}>
              Como funciona
            </a>
          </div>
        </section>

        <section
          id="o-que-e"
          aria-labelledby="titulo-o-que-e"
          className="flex min-h-svh scroll-mt-16 items-center px-4"
        >
          <Revelar className="mx-auto w-full max-w-6xl">
            <div className={`max-w-md ${painel}`}>
              <p className="rotulo">01 — O que é</p>
              <h2 id="titulo-o-que-e" className="mt-3 text-5xl">
                O diário que vira personagem
              </h2>
              <p className="mt-4 text-texto-secundario">
                Cada troca de óleo, peça nova ou modificação vira um registro.
                Com o tempo, o diário conta a história do carro, e essa história
                vira a ficha dele.
              </p>
            </div>
          </Revelar>
        </section>

        <section
          aria-labelledby="titulo-dados"
          className="flex min-h-svh items-center px-4"
        >
          <Revelar className="mx-auto flex w-full max-w-6xl justify-end">
            <div className={`max-w-md ${painel}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="rotulo">02 — Seus dados</p>
                <Selo>Exemplo</Selo>
              </div>
              <h2 id="titulo-dados" className="mt-3 text-5xl">
                Tudo o que o carro já viveu
              </h2>
              <ul
                className="mt-6 flex flex-col gap-3"
                aria-label="Exemplo de diário"
              >
                {[
                  ["Troca de óleo e filtro", "Manutenção · 120.500 km"],
                  ["Pastilhas de freio", "Manutenção · espaço Freios"],
                  ["Rodas aro 15", "Modificação · espaço Rodas"],
                ].map(([titulo, detalhe]) => (
                  <li
                    key={titulo}
                    className="rounded-2xl border border-borda bg-superficie/80 p-4"
                  >
                    <p className="font-medium">{titulo}</p>
                    <p className="text-sm text-texto-secundario">{detalhe}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-texto-secundario">
                Valores e notas são privados por padrão. Em cada registro, você
                escolhe quem pode ver.
              </p>
            </div>
          </Revelar>
        </section>

        <section
          aria-labelledby="titulo-personagem"
          className="flex min-h-svh items-center px-4"
        >
          <Revelar className="mx-auto w-full max-w-6xl">
            <div className={`max-w-md ${painel}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="rotulo">03 — Seu personagem</p>
                <Selo>Em breve</Selo>
              </div>
              <h2 id="titulo-personagem" className="mt-3 text-5xl">
                Seu carro ganha uma ficha
              </h2>
              <figure className="mt-6 flex flex-col gap-4 rounded-2xl border border-borda bg-superficie/80 p-5">
                <figcaption className="flex items-baseline justify-between">
                  <span className="font-titulo text-3xl">Prata</span>
                  <span className="rotulo">Nível 7 · exemplo</span>
                </figcaption>
                {ATRIBUTOS_EXEMPLO.map((a) => (
                  <Barra key={a.nome} {...a} />
                ))}
                <Barra nome="Condição" valor={91} cor="bg-condicao" />
              </figure>
              <p className="mt-4 text-sm text-texto-secundario">
                Exemplo ilustrativo. Os atributos virão do diário, nunca do
                dinheiro gasto: XP só vem de cuidar do carro.
              </p>
            </div>
          </Revelar>
        </section>

        <section
          aria-labelledby="titulo-compartilhar"
          className="flex min-h-svh items-center px-4"
        >
          <Revelar className="mx-auto flex w-full max-w-6xl flex-col items-end gap-6 sm:flex-row sm:items-center sm:justify-end">
            {/* Card 9:16 de stories (ilustração, sem dados reais). */}
            <div
              aria-hidden="true"
              className="flex aspect-[9/16] w-44 -rotate-6 flex-col justify-between rounded-3xl border border-destaque/40 bg-gradient-to-b from-superficie-2 to-fundo p-4 shadow-2xl shadow-destaque/20 sm:w-52"
            >
              <span className="text-[0.6rem] font-semibold tracking-[0.25em] uppercase">
                ◆ Garagem RPG
              </span>
              <SilhuetaCarro className="w-full text-destaque" />
              <div>
                <p className="font-titulo text-2xl">Prata</p>
                <p className="text-[0.6rem] tracking-[0.2em] text-texto-secundario uppercase">
                  Nível 7 · Condição 91
                </p>
              </div>
            </div>
            <div className={`max-w-md ${painel}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="rotulo">04 — Compartilhe</p>
                <Selo>Em breve</Selo>
              </div>
              <h2 id="titulo-compartilhar" className="mt-3 text-5xl">
                Uma ficha pronta para os stories
              </h2>
              <p className="mt-4 text-texto-secundario">
                Gere um card vertical com a ficha do carro e mostre a evolução
                para os amigos. Só entra no card o que você deixou público.
              </p>
            </div>
          </Revelar>
        </section>

        <section
          aria-labelledby="titulo-privacidade"
          className="flex min-h-svh items-center px-4"
        >
          <Revelar className="mx-auto w-full max-w-6xl">
            <div className={`max-w-lg ${painel}`}>
              <p className="rotulo">05 — Privacidade</p>
              <h2 id="titulo-privacidade" className="mt-3 text-5xl">
                Seu carro, suas regras
              </h2>
              <ul className="mt-6 flex flex-col gap-3 text-texto-secundario">
                {[
                  "Nunca guardamos nem mostramos onde o carro fica. O perfil mostra só a cidade.",
                  "Valores e notas são privados por padrão.",
                  "Sem rastreadores de anúncio: só o cookie que mantém você logado.",
                ].map((t) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden="true" className="text-condicao">
                      ✓
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Revelar>
        </section>

        <section
          aria-labelledby="titulo-status"
          className="flex min-h-svh items-center px-4"
        >
          <Revelar className="mx-auto grid w-full max-w-6xl gap-4 sm:grid-cols-2">
            <h2 id="titulo-status" className="text-5xl sm:col-span-2">
              O que já funciona, e o que vem aí
            </h2>
            <div className={painel}>
              <p className="rotulo !text-condicao">Disponível</p>
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-5">
                <li>Garagem com seus carros</li>
                <li>Diário de manutenções e modificações</li>
                <li>Itens com peças, mão de obra e valores</li>
                <li>Visibilidade por registro</li>
                <li>Histórico de edições de cada registro</li>
              </ul>
            </div>
            <div className={painel}>
              <p className="rotulo !text-destaque">Em breve</p>
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-texto-secundario">
                <li>Fotos no diário</li>
                <li>Ficha de RPG, níveis e conquistas</li>
                <li>Cards para stories</li>
                <li>Feed, seguir e comentar</li>
                <li>Mapa de encontros</li>
              </ul>
              <p className="mt-4 text-sm text-texto-apagado">
                Sem datas prometidas: lançamos quando estiver bom.
              </p>
            </div>
          </Revelar>
        </section>

        <section className="flex min-h-[80svh] flex-col items-center justify-end px-4 pb-24 text-center">
          <h2 className="text-6xl sm:text-7xl">
            Abra sua <em className="text-destaque">garagem</em>.
          </h2>
          <Link href="/entrar" className={`mt-8 ${ctaPrimario}`}>
            Criar minha garagem
          </Link>
        </section>
      </main>
    </>
  );
}
