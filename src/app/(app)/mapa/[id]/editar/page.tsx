import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { Cartao } from "@/components/formulario";
import { duracaoEmHoras, paraCampoDataHora } from "@/dominio/encontro";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { apagarEncontro, salvarEncontro } from "../../acoes";
import { FormularioEncontro } from "../../formulario-encontro";

export const metadata: Metadata = { title: "Editar encontro · LifeInGears" };

export default function PaginaEditarEncontro({
  params,
}: PageProps<"/mapa/[id]/editar">) {
  return (
    <Cartao>
      <h1 className="text-4xl">Editar encontro</h1>
      <Suspense
        fallback={<p className="mt-6 text-texto-secundario">Carregando…</p>}
      >
        {params.then(({ id }) => (
          <Conteudo id={id} />
        ))}
      </Suspense>
    </Cartao>
  );
}

async function Conteudo({ id }: { id: string }) {
  const { supabase, perfil } = await exigirPerfil();
  if (!ehUuid(id)) notFound();
  // Filtro pelo organizador: a RLS também mostra encontros de outras
  // pessoas; "não existe" e "não é seu" dão o mesmo 404.
  const { data: e } = await supabase
    .from("encontros")
    .select(
      "id, titulo, tipo, descricao, local_nome, cidade, lat, lng, inicio, fim",
    )
    .eq("id", id)
    .eq("organizador_id", perfil.id)
    .maybeSingle();
  if (!e) notFound();

  return (
    <div className="mt-6 flex flex-col gap-8">
      <FormularioEncontro
        acao={salvarEncontro.bind(null, e.id)}
        valores={{
          titulo: e.titulo,
          tipo: e.tipo,
          descricao: e.descricao ?? "",
          local_nome: e.local_nome,
          cidade: e.cidade ?? "",
          lat: String(e.lat),
          lng: String(e.lng),
          inicio: paraCampoDataHora(e.inicio),
          duracao: duracaoEmHoras(e.inicio, e.fim),
        }}
        rotuloEnviar="Salvar alterações"
        voltarPara={`/mapa/${e.id}`}
      />
      <ExcluirComConfirmacao
        acao={apagarEncontro.bind(null, e.id)}
        rotulo="Cancelar e excluir o encontro"
        aviso="O encontro some do mapa e as confirmações de presença são apagadas."
      />
    </div>
  );
}
