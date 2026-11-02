import "server-only";
import { exigirPerfil } from "@/lib/sessao";

// Consulta do feed. Quem pode ver o quê (carro público, bloqueio nos dois
// sentidos) é decidido pela RLS do banco; aqui só escolhemos a aba e a página.

export const TAMANHO_PAGINA = 10;
export type Aba = "descobrir" | "seguindo";

type Supabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

const CAMPOS = `id, legenda, criado_em, dono_id,
  perfis (id, nome_usuario, nome_exibicao, personagem),
  carros (id, apelido, marca, modelo, ano),
  fotos_post!inner (id, chave, descricao, largura, altura, criado_em)`;

/** Cursor da paginação: um timestamptz em ISO, ou nada. */
export function lerCursor(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 40) return null;
  return Number.isNaN(Date.parse(valor)) ? null : valor;
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

  const { data } = await consulta;
  const posts = (data ?? []).slice(0, TAMANHO_PAGINA);
  const proximo =
    (data?.length ?? 0) > TAMANHO_PAGINA
      ? posts[posts.length - 1].criado_em
      : null;
  return { posts, proximo };
}

export type PostDoFeed = Awaited<
  ReturnType<typeof carregarFeed>
>["posts"][number];
