import "server-only";
import { cache } from "react";
import { clientePublico } from "./supabase/publico";
import { ehUuid } from "./uuid";

// Consultas das páginas públicas. Sempre pelo cliente anônimo: o banco só
// devolve carros públicos e as views *_publicos (sem notas; valores só
// quando o registro é "publico"). cache(): página, título e imagem de
// prévia pedem o mesmo carro na mesma requisição, e a consulta roda 1 vez.

export const carroPublico = cache(async (carroId: string) => {
  if (!ehUuid(carroId)) return null;
  const supabase = await clientePublico();
  const { data: carro } = await supabase
    .from("carros")
    .select("id, dono_id, marca, modelo, ano, apelido, foto_capa")
    .eq("id", carroId)
    .eq("publico", true)
    .maybeSingle();
  if (!carro) return null;

  const { data: dono } = await supabase
    .from("perfis")
    .select("nome_usuario, nome_exibicao, cidade")
    .eq("id", carro.dono_id)
    .maybeSingle();
  if (!dono) return null;
  return { carro, dono };
});

export const diarioPublico = cache(async (carroId: string) => {
  const supabase = await clientePublico();
  const { data: registros } = await supabase
    .from("registros_publicos")
    .select("id, tipo, titulo, data, km, visibilidade")
    .eq("carro_id", carroId)
    .order("data", { ascending: false });
  const ids = (registros ?? []).flatMap((r) => (r.id ? [r.id] : []));
  if (ids.length === 0) return [];

  const [{ data: itens }, { data: fotos }] = await Promise.all([
    supabase
      .from("itens_publicos")
      .select(
        "id, registro_id, descricao, categoria, quantidade, valor_centavos",
      )
      .in("registro_id", ids),
    supabase
      .from("fotos_publicas")
      .select("id, registro_id, chave, descricao")
      .in("registro_id", ids)
      .order("criado_em"),
  ]);

  return (registros ?? []).map((r) => ({
    ...r,
    itens: (itens ?? []).filter((i) => i.registro_id === r.id),
    fotos: (fotos ?? []).filter((f) => f.registro_id === r.id),
  }));
});

export const perfilPublico = cache(async (nomeUsuario: string) => {
  if (!/^[a-z0-9_]{3,30}$/.test(nomeUsuario)) return null;
  const supabase = await clientePublico();
  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, nome_usuario, nome_exibicao, cidade")
    .eq("nome_usuario", nomeUsuario)
    .maybeSingle();
  if (!perfil) return null;
  const { data: carros } = await supabase
    .from("carros")
    .select("id, marca, modelo, ano, apelido, foto_capa")
    .eq("dono_id", perfil.id)
    .eq("publico", true)
    .order("criado_em");
  return { perfil, carros: carros ?? [] };
});
