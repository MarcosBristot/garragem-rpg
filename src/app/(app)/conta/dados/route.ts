import { urlDaFoto } from "@/lib/fotos/armazenamento";
import { criarClienteServidor } from "@/lib/supabase/servidor";

// Portabilidade (LGPD art. 18, V): tudo o que é seu, num arquivo JSON.
// A RLS já limita cada consulta ao dono; o filtro por dono_id evita
// incluir carros públicos de outras pessoas.
export async function GET() {
  const supabase = await criarClienteServidor();
  const { data: sessao } = await supabase.auth.getClaims();
  const usuarioId = sessao?.claims.sub;
  if (!usuarioId) {
    return Response.json(
      { erro: "Entre na conta para baixar seus dados." },
      { status: 401 },
    );
  }

  const [
    perfil,
    carros,
    registros,
    historico,
    fotos,
    ordens,
    posts,
    fotosPosts,
    seguindo,
    bloqueios,
    curtidas,
    comentarios,
    encontros,
    presencas,
  ] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", usuarioId).maybeSingle(),
    supabase.from("carros").select("*").eq("dono_id", usuarioId),
    supabase.from("registros").select("*").eq("dono_id", usuarioId),
    supabase.from("historico_edicoes").select("*").eq("dono_id", usuarioId),
    supabase.from("fotos_registro").select("*").eq("dono_id", usuarioId),
    supabase.from("ordens_servico").select("*").eq("dono_id", usuarioId),
    supabase.from("posts").select("*").eq("dono_id", usuarioId),
    supabase.from("fotos_post").select("*").eq("dono_id", usuarioId),
    supabase.from("seguidores").select("*").eq("seguidor_id", usuarioId),
    supabase.from("bloqueios").select("*").eq("bloqueador_id", usuarioId),
    supabase.from("curtidas").select("*").eq("perfil_id", usuarioId),
    supabase.from("comentarios").select("*").eq("autor_id", usuarioId),
    supabase.from("encontros").select("*").eq("organizador_id", usuarioId),
    supabase.from("presencas").select("*").eq("perfil_id", usuarioId),
  ]);
  // Itens não têm dono_id: filtra pelos registros da pessoa (a RLS também
  // libera itens de registros públicos de outras pessoas).
  const idsRegistros = (registros.data ?? []).map((r) => r.id);
  const itens =
    idsRegistros.length > 0
      ? await supabase
          .from("itens_registro")
          .select("*")
          .in("registro_id", idsRegistros)
      : { data: [] };

  // Fotos: link temporário (24 h) do tamanho maior de cada uma.
  const comLink = async (chave: string) => ({
    chave,
    baixar_ate_24h: await urlDaFoto(chave, "cheia", 24 * 3600),
  });
  const capas = await Promise.all(
    (carros.data ?? []).flatMap((c) =>
      c.foto_capa ? [comLink(c.foto_capa)] : [],
    ),
  );
  const fotosRegistros = await Promise.all(
    (fotos.data ?? []).map(async (f) => ({
      ...f,
      ...(await comLink(f.chave)),
    })),
  );

  const ordensComLink = await Promise.all(
    (ordens.data ?? []).map(async (o) => ({
      ...o,
      ...(o.foto_chave ? await comLink(o.foto_chave) : {}),
    })),
  );
  const fotosDosPosts = await Promise.all(
    (fotosPosts.data ?? []).map(async (f) => ({
      ...f,
      ...(await comLink(f.chave)),
    })),
  );

  const fotoPerfil = perfil.data?.foto ? await comLink(perfil.data.foto) : null;

  const arquivo = {
    exportado_em: new Date().toISOString(),
    aviso:
      "Cópia dos seus dados no Garagem RPG. Contém notas e valores privados: guarde com cuidado.",
    conta: { email: sessao?.claims.email ?? null },
    perfil: perfil.data,
    foto_perfil: fotoPerfil,
    carros: carros.data ?? [],
    registros: registros.data ?? [],
    itens_registro: itens.data ?? [],
    historico_edicoes: historico.data ?? [],
    fotos_capa: capas,
    fotos_registros: fotosRegistros,
    ordens_servico: ordensComLink,
    posts: posts.data ?? [],
    fotos_posts: fotosDosPosts,
    seguindo: seguindo.data ?? [],
    bloqueios: bloqueios.data ?? [],
    curtidas: curtidas.data ?? [],
    comentarios: comentarios.data ?? [],
    encontros_organizados: encontros.data ?? [],
    presencas_em_encontros: presencas.data ?? [],
  };

  return new Response(JSON.stringify(arquivo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="garagem-rpg-meus-dados.json"',
      // Dados pessoais: nunca em cache de CDN ou proxy.
      "Cache-Control": "private, no-store",
    },
  });
}
