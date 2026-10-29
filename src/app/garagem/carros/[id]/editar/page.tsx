import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { apagarCarro, salvarCarro } from "../../acoes";
import { FormularioCarro } from "../../formulario-carro";
import { ExcluirCarro } from "./excluir-carro";

export const metadata: Metadata = { title: "Editar carro · Garagem RPG" };

// O [id] da URL só é conhecido na requisição: com cacheComponents,
// ele é lido dentro do <Suspense>, e o título fica na casca estática.
export default function PaginaEditarCarro({
  params,
}: PageProps<"/garagem/carros/[id]/editar">) {
  return (
    <Cartao>
      <h1 className="mb-6 text-2xl font-bold">Editar carro</h1>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
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

  // Filtra pelo dono: a RLS deixa ler carros públicos de outras pessoas,
  // mas aqui só faz sentido editar os seus.
  const { data: carro } = await supabase
    .from("carros")
    .select("id, marca, modelo, ano, apelido, publico")
    .eq("id", id)
    .eq("dono_id", perfil.id)
    .maybeSingle();
  if (!carro) notFound();

  return (
    <div className="flex flex-col gap-8">
      <FormularioCarro
        acao={salvarCarro.bind(null, carro.id)}
        valores={{
          marca: carro.marca,
          modelo: carro.modelo,
          ano: carro.ano?.toString() ?? "",
          apelido: carro.apelido ?? "",
          publico: carro.publico,
        }}
        rotuloEnviar="Salvar alterações"
      />
      <ExcluirCarro acao={apagarCarro.bind(null, carro.id)} />
    </div>
  );
}
