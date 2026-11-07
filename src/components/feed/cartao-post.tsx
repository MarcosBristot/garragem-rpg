import Link from "next/link";
import { bloquear } from "@/app/(app)/pessoas-acoes";
import { excluirPost } from "@/app/(app)/feed/acoes";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { BotaoCurtir } from "@/components/feed/botao-curtir";
import { FotoAssinada } from "@/components/foto-assinada";
import { AvatarPersonagem } from "@/components/personagem/avatar-personagem";
import { personagemDoPerfil } from "@/dominio/personagem";
import { nomeDoCarro } from "@/lib/carros";
import { tempoDesde } from "@/lib/datas";
import type { PostDoFeed } from "@/lib/feed";

export function CartaoPost({
  post,
  usuarioId,
}: {
  post: PostDoFeed;
  usuarioId: string;
}) {
  const autor = post.perfis;
  const carro = post.carros;
  if (!autor || !carro) return null;
  const nome = autor.nome_exibicao ?? autor.nome_usuario;
  const meu = post.dono_id === usuarioId;
  const idTitulo = `post-${post.id}`;
  const comentarios = post.comentarios[0]?.count ?? 0;

  return (
    <article
      aria-labelledby={idTitulo}
      className="overflow-hidden rounded-3xl border border-borda bg-superficie"
    >
      <header className="flex items-center gap-3 p-4">
        <Link
          href={`/u/${autor.nome_usuario}`}
          tabIndex={-1}
          aria-hidden="true"
        >
          <AvatarPersonagem
            personagem={personagemDoPerfil(autor.personagem, autor.id)}
            className="size-11 rounded-xl bg-superficie-2 p-0.5"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <h2
            id={idTitulo}
            className="truncate font-sans text-base font-semibold"
          >
            <Link href={`/u/${autor.nome_usuario}`} className="hover:underline">
              {nome}
            </Link>
          </h2>
          <p className="truncate text-sm text-texto-secundario">
            <Link href={`/c/${carro.id}`} className="hover:underline">
              {nomeDoCarro(carro)}
            </Link>
            {" · "}
            <time dateTime={post.criado_em}>{tempoDesde(post.criado_em)}</time>
          </p>
        </div>
        <details className="relative">
          <summary
            aria-label="Mais opções do post"
            className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-xl text-texto-secundario hover:bg-superficie-2 focus-visible:outline-2 focus-visible:outline-destaque [&::-webkit-details-marker]:hidden"
          >
            ⋯
          </summary>
          <div className="absolute right-0 z-10 mt-1 flex w-64 flex-col gap-1 rounded-2xl border border-borda bg-superficie-2 p-2 shadow-xl">
            {meu ? (
              <ExcluirComConfirmacao
                acao={excluirPost.bind(null, post.id)}
                rotulo="Excluir post"
                aviso="O post e as fotos dele serão apagados."
              />
            ) : (
              <>
                <Link
                  href={`/denunciar?tipo=post&id=${post.id}`}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-borda/50"
                >
                  Denunciar post
                </Link>
                <form action={bloquear.bind(null, post.dono_id)}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm text-erro hover:bg-borda/50"
                  >
                    Bloquear @{autor.nome_usuario}
                  </button>
                </form>
              </>
            )}
          </div>
        </details>
      </header>

      {/* Fotos lado a lado; arrasta (ou rola) para ver as outras. */}
      <div
        className="flex snap-x snap-mandatory overflow-x-auto"
        {...(post.fotos_post.length > 1
          ? {
              role: "region",
              "aria-label": `${post.fotos_post.length} fotos, role para o lado`,
              tabIndex: 0,
            }
          : {})}
      >
        {post.fotos_post.map((foto, i) => (
          // A descrição de cada foto aparece embaixo dela (antes só ia no
          // alt e ninguém via). Com legenda visível, o alt fica genérico para
          // o leitor de tela não ler o mesmo texto duas vezes.
          <figure key={foto.id} className="w-full shrink-0 snap-center">
            <FotoAssinada
              chave={foto.chave}
              alt={`Foto ${i + 1} de ${nomeDoCarro(carro)}, publicada por ${nome}`}
              sizes="(min-width: 640px) 576px, 100vw"
              className="aspect-square w-full object-cover"
            />
            {foto.descricao ? (
              <figcaption className="px-4 pt-2 text-sm whitespace-pre-line text-texto-secundario">
                {foto.descricao}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
      {post.fotos_post.length > 1 ? (
        <p className="px-4 pt-2 text-xs text-texto-apagado">
          {post.fotos_post.length} fotos · arraste para o lado
        </p>
      ) : null}

      <div className="flex items-center gap-1 px-2 pt-2">
        <BotaoCurtir
          postId={post.id}
          curtido={post.curtiu}
          total={post.curtidas[0]?.count ?? 0}
          proprio={meu}
        />
        <Link
          href={`/feed/p/${post.id}#comentarios`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-texto-secundario hover:bg-superficie-2 hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            <path d="M4 5h16v11H9l-5 4z" />
          </svg>
          {comentarios} {comentarios === 1 ? "comentário" : "comentários"}
        </Link>
      </div>

      {post.legenda ? (
        <p className="px-4 pt-1 pb-4 whitespace-pre-line">{post.legenda}</p>
      ) : (
        <div className="h-3" />
      )}
    </article>
  );
}
