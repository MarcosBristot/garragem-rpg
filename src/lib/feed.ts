import "server-only";
import { exigirPerfil } from "@/lib/sessao";

// Consultas do feed. Quem pode ver o quê (carro público, bloqueio nos dois
// sentidos) é decidido pela RLS do banco; aqui só escolhemos a aba e a página.

export const TAMANHO_PAGINA = 10;
export type Aba = "descobrir" | "seguindo";

type Supabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

// Totais de curtidas e comentários também passam pela RLS: cada pessoa
// conta só o que pode ver (bloqueios ficam de fora). O autor vem pela FK
// nomeada: `curtidas` liga posts a perfis e deixaria "perfis" ambíguo.
const CAMPOS = `id, legenda, criado_em, dono_id,
  perfis!posts_dono_id_fkey (id, nome_usuario, nome_exibicao, personagem, foto),
  carros (id, apelido, marca, modelo, ano),
  fotos_post!inner (id, chave, descricao, largura, altura, criado_em),
  curtidas (count),
  comentarios (count)`;

/** Cursor da paginação: um timestamptz em ISO, ou nada. */
export function lerCursor(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 40) return null;
  return Number.isNaN(Date.parse(valor)) ? null : valor;
}

/** Quais destes posts a pessoa já curtiu. */
async function curtidosPor(
  supabase: Supabase,
  usuarioId: string,
  postIds: string[],
): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data } = await supabase
    .from("curtidas")
    .select("post_id")
    .eq("perfil_id", usuarioId)
    .in("post_id", postIds);
  return new Set((data ?? []).map((c) => c.post_id));
}

function montar<T extends { id: string }>(posts: T[], curtidos: Set<string>) {
  return posts.map((post) => ({ ...post, curtiu: curtidos.has(post.id) }));
}

export async function carregarFeed(
  supabase: Supabase,
  usuarioId: string,
  aba: Aba,
  antes: string | null,
) {
  let consulta = supabase
    .from("posts")
    .select(CAMPOS)
    .order("criado_em", { ascending: false })
    .order("criado_em", { referencedTable: "fotos_post", ascending: true })
    .limit(TAMANHO_PAGINA + 1);
  if (antes) consulta = consulta.lt("criado_em", antes);

  if (aba === "seguindo") {
    const { data: seguidos } = await supabase
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", usuarioId);
    const ids = [usuarioId, ...(seguidos ?? []).map((s) => s.seguido_id)];
    consulta = consulta.in("dono_id", ids);
  }

  // Erro de consulta não pode virar "ainda não há posts": deixa estourar.
  const { data, error } = await consulta;
  if (error) throw new Error(`Feed: ${error.code} ${error.message}`);
  const pagina = (data ?? []).slice(0, TAMANHO_PAGINA);
  const proximo =
    (data?.length ?? 0) > TAMANHO_PAGINA
      ? pagina[pagina.length - 1].criado_em
      : null;
  const curtidos = await curtidosPor(
    supabase,
    usuarioId,
    pagina.map((p) => p.id),
  );
  return { posts: montar(pagina, curtidos), proximo };
}

/** Um post e os comentários dele; null se não existe ou não é visível. */
export async function carregarPost(
  supabase: Supabase,
  usuarioId: string,
  postId: string,
) {
  const { data: post, error } = await supabase
    .from("posts")
    .select(CAMPOS)
    .eq("id", postId)
    .order("criado_em", { referencedTable: "fotos_post", ascending: true })
    .maybeSingle();
  if (error) throw new Error(`Post: ${error.code} ${error.message}`);
  if (!post) return null;

  const [curtidos, { data: comentarios }] = await Promise.all([
    curtidosPor(supabase, usuarioId, [post.id]),
    supabase
      .from("comentarios")
      .select(
        "id, texto, criado_em, autor_id, perfis (id, nome_usuario, nome_exibicao, personagem, foto)",
      )
      .eq("post_id", post.id)
      .order("criado_em")
      .limit(200),
  ]);
  return {
    post: montar([post], curtidos)[0],
    comentarios: comentarios ?? [],
  };
}

export type PostDoFeed = Awaited<
  ReturnType<typeof carregarFeed>
>["posts"][number];

export type ComentarioDoPost = NonNullable<
  Awaited<ReturnType<typeof carregarPost>>
>["comentarios"][number];
