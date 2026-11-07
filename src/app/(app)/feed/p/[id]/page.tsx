import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CartaoPost } from "@/components/feed/cartao-post";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { tempoDesde } from "@/lib/datas";
import { carregarPost, type ComentarioDoPost } from "@/lib/feed";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { excluirComentario } from "../../acoes";
import { FormularioComentario } from "./formulario-comentario";

export const metadata: Metadata = { title: "Post · LifeInGears" };

export default function PaginaPost({ params }: PageProps<"/feed/p/[id]">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10"
    >
      <Link
        href="/feed"
        className="inline-flex min-h-11 w-fit items-center text-sm text-texto-secundario hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque"
      >
        ← Feed
      </Link>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        {params.then(({ id }) => (
          <Conteudo postId={id} />
        ))}
      </Suspense>
    </main>
  );
}

async function Conteudo({ postId }: { postId: string }) {
  // Não existe, não é visível ou bloqueado: o mesmo 404.
  if (!ehUuid(postId)) notFound();
  const { supabase, perfil } = await exigirPerfil();
  const dados = await carregarPost(supabase, perfil.id, postId);
  if (!dados) notFound();
  const { post, comentarios } = dados;
  const donoDoPost = post.dono_id === perfil.id;

  return (
    <>
      <CartaoPost post={post} usuarioId={perfil.id} />

      <section
        id="comentarios"
        aria-labelledby="titulo-comentarios"
        className="flex scroll-mt-24 flex-col gap-4"
      >
        <h2 id="titulo-comentarios" className="text-3xl">
          Comentários
        </h2>
        {comentarios.length === 0 ? (
          <p className="text-texto-secundario">Nenhum comentário ainda.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {comentarios.map((c) => (
              <li key={c.id}>
                <Comentario
                  comentario={c}
                  postId={post.id}
                  podeApagar={donoDoPost || c.autor_id === perfil.id}
                  meu={c.autor_id === perfil.id}
                />
              </li>
            ))}
          </ol>
        )}
        <FormularioComentario postId={post.id} />
      </section>
    </>
  );
}

function Comentario({
  comentario,
  postId,
  podeApagar,
  meu,
}: {
  comentario: ComentarioDoPost;
  postId: string;
  podeApagar: boolean;
  meu: boolean;
}) {
  const autor = comentario.perfis;
  if (!autor) return null;
  const nome = autor.nome_exibicao ?? autor.nome_usuario;

  return (
    <article className="flex gap-3 rounded-2xl border border-borda bg-superficie p-3">
      <AvatarPerfil perfil={autor} tamanho="36px" className="size-9 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm">
          <Link
            href={`/u/${autor.nome_usuario}`}
            className="font-semibold hover:underline"
          >
            {nome}
          </Link>{" "}
          <time dateTime={comentario.criado_em} className="text-texto-apagado">
            {tempoDesde(comentario.criado_em)}
          </time>
        </p>
        <p className="break-words whitespace-pre-line">{comentario.texto}</p>
        <div className="flex gap-1 text-sm">
          {podeApagar ? (
            <form action={excluirComentario.bind(null, comentario.id, postId)}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center rounded-lg px-2 text-texto-secundario hover:text-erro"
              >
                Apagar
              </button>
            </form>
          ) : null}
          {meu ? null : (
            <Link
              href={`/denunciar?tipo=comentario&id=${comentario.id}`}
              className="inline-flex min-h-11 items-center rounded-lg px-2 text-texto-secundario hover:text-texto"
            >
              Denunciar
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
