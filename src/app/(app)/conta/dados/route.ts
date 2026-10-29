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

  const [perfil, carros, registros, itens, historico] = await Promise.all([
    supabase.from("perfis").select("*").eq("id", usuarioId).maybeSingle(),
    supabase.from("carros").select("*").eq("dono_id", usuarioId),
    supabase.from("registros").select("*").eq("dono_id", usuarioId),
    supabase.from("itens_registro").select("*"),
    supabase.from("historico_edicoes").select("*").eq("dono_id", usuarioId),
  ]);

  const arquivo = {
    exportado_em: new Date().toISOString(),
    aviso:
      "Cópia dos seus dados no Garagem RPG. Contém notas e valores privados: guarde com cuidado.",
    conta: { email: sessao?.claims.email ?? null },
    perfil: perfil.data,
    carros: carros.data ?? [],
    registros: registros.data ?? [],
    itens_registro: itens.data ?? [],
    historico_edicoes: historico.data ?? [],
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
