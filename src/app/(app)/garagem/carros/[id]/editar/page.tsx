import type { Metadata } from "next";
import { Suspense } from "react";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { Cartao } from "@/components/formulario";
import { carroDoDonoOu404 } from "@/lib/carros";
import { exigirPerfil } from "@/lib/sessao";
import { apagarCarro, salvarCarro } from "../../acoes";
import { FormularioCarro } from "../../formulario-carro";

export const metadata: Metadata = { title: "Editar carro · Garagem RPG" };

// O [id] da URL só é conhecido na requisição: com cacheComponents,
// ele é lido dentro do <Suspense>, e o título fica na casca estática.
export default function PaginaEditarCarro({
  params,
}: PageProps<"/garagem/carros/[id]/editar">) {
  return (
    <Cartao>
      <h1 className="mb-6 text-4xl">Editar carro</h1>
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
  const carro = await carroDoDonoOu404(supabase, perfil.id, id);

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
        voltarPara={`/garagem/carros/${carro.id}`}
      />
      <ExcluirComConfirmacao
        acao={apagarCarro.bind(null, carro.id)}
        rotulo="Excluir carro"
        aviso="Isso apaga o carro e todos os registros do diário dele."
      />
    </div>
  );
}
