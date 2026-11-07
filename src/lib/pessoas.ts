import "server-only";
import type { exigirPerfil } from "@/lib/sessao";

// Consultas da página Pessoas. Perfis são públicos (nome, @, cidade, foto,
// personagem); quem você segue só você vê (RLS de `seguidores`).

type Supabase = Awaited<ReturnType<typeof exigirPerfil>>["supabase"];

const CAMPOS = "id, nome_usuario, nome_exibicao, cidade, personagem, foto";
export type Pessoa = {
  id: string;
  nome_usuario: string;
  nome_exibicao: string | null;
  cidade: string | null;
  personagem: unknown;
  foto: string | null;
};

/** Ids de quem eu sigo e de quem eu bloqueei. */
export async function minhasRelacoes(supabase: Supabase, eu: string) {
  const [{ data: sigo, error: e1 }, { data: bloqueei, error: e2 }] =
    await Promise.all([
      supabase.from("seguidores").select("seguido_id").eq("seguidor_id", eu),
      supabase.from("bloqueios").select("bloqueado_id").eq("bloqueador_id", eu),
    ]);
  if (e1 || e2) throw new Error(`Pessoas: ${(e1 ?? e2)?.code}`);
  return {
    sigo: new Set((sigo ?? []).map((s) => s.seguido_id)),
    bloqueei: new Set((bloqueei ?? []).map((b) => b.bloqueado_id)),
  };
}

/** Busca por @ ou nome (termo já limpo por `termoBusca`). */
export async function buscarPessoas(
  supabase: Supabase,
  eu: string,
  termo: string,
): Promise<Pessoa[]> {
  const { data, error } = await supabase
    .from("perfis")
    .select(CAMPOS)
    .or(`nome_usuario.ilike.%${termo}%,nome_exibicao.ilike.%${termo}%`)
    .neq("id", eu)
    .order("nome_usuario")
    .limit(20);
  if (error) throw new Error(`Busca de pessoas: ${error.code}`);
  return data;
}

/** Quem eu sigo, do mais recente para o mais antigo. */
export async function quemSigo(
  supabase: Supabase,
  eu: string,
): Promise<Pessoa[]> {
  const { data, error } = await supabase
    .from("seguidores")
    .select(`perfis!seguidores_seguido_id_fkey (${CAMPOS})`)
    .eq("seguidor_id", eu)
    .order("criado_em", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Quem sigo: ${error.code}`);
  return data.flatMap((s) => (s.perfis ? [s.perfis] : []));
}

/** Contas mais novas (para quem ainda não segue ninguém achar gente). */
export async function genteNova(
  supabase: Supabase,
  eu: string,
): Promise<Pessoa[]> {
  const { data, error } = await supabase
    .from("perfis")
    .select(CAMPOS)
    .neq("id", eu)
    .order("criado_em", { ascending: false })
    .limit(30);
  if (error) throw new Error(`Gente nova: ${error.code}`);
  return data;
}
