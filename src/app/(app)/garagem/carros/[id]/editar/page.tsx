import type { Metadata } from "next";
import { Suspense } from "react";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { EnviarFoto } from "@/components/enviar-foto";
import { FotoAssinada } from "@/components/foto-assinada";
import { Botao, Cartao } from "@/components/formulario";
import { carroDoDonoOu404, nomeDoCarro } from "@/lib/carros";
import { exigirPerfil } from "@/lib/sessao";
import { apagarCarro, salvarCarro } from "../../acoes";
import { FormularioCarro } from "../../formulario-carro";
import { enviarCapa, removerCapa } from "../fotos-acoes";

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
      <section
        aria-labelledby="titulo-capa"
        className="flex flex-col gap-4 border-t border-borda pt-6"
      >
        <h2 id="titulo-capa" className="text-3xl">
          Foto de capa
        </h2>
        {carro.foto_capa ? (
          <div className="flex flex-col gap-3">
            <FotoAssinada
              chave={carro.foto_capa}
              alt={`Foto de capa de ${nomeDoCarro(carro)}`}
              sizes="(min-width: 448px) 400px, 90vw"
              className="aspect-video w-full rounded-2xl object-cover"
            />
            <form action={removerCapa.bind(null, carro.id)}>
              <Botao type="submit" variante="perigo">
                Remover capa
              </Botao>
            </form>
          </div>
        ) : (
          <p className="text-sm text-texto-secundario">
            Sem foto, o carro aparece com a silhueta. A foto perde dados de
            localização (GPS) antes de ser salva.
          </p>
        )}
        <EnviarFoto
          acao={enviarCapa.bind(null, carro.id)}
          rotulo={carro.foto_capa ? "Trocar capa" : "Escolher foto de capa"}
        />
      </section>
      <ExcluirComConfirmacao
        acao={apagarCarro.bind(null, carro.id)}
        rotulo="Excluir carro"
        aviso="Isso apaga o carro, todos os registros do diário e as fotos dele."
      />
    </div>
  );
}
