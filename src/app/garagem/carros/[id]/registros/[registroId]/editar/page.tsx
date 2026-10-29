import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { Cartao } from "@/components/formulario";
import { RolarParaAncora } from "@/components/rolar-para-ancora";
import { carroDoDonoOu404, nomeDoCarro } from "@/lib/carros";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { apagarRegistro, salvarRegistro } from "../../acoes";
import { FormularioRegistro } from "../../formulario-registro";
import { adicionarItem } from "../itens/acoes";
import { FormularioItem } from "../itens/formulario-item";
import { ListaItens } from "../itens/lista-itens";

export const metadata: Metadata = { title: "Editar registro · Garagem RPG" };

export default function PaginaEditarRegistro({
  params,
}: PageProps<"/garagem/carros/[id]/registros/[registroId]/editar">) {
  return (
    <Cartao>
      <h1 className="text-2xl font-bold">Editar registro</h1>
      <Suspense
        fallback={<p className="mt-6 text-texto-secundario">Carregando…</p>}
      >
        {params.then(({ id, registroId }) => (
          <Conteudo carroId={id} registroId={registroId} />
        ))}
      </Suspense>
    </Cartao>
  );
}

async function Conteudo({
  carroId,
  registroId,
}: {
  carroId: string;
  registroId: string;
}) {
  const { supabase, perfil } = await exigirPerfil();
  const carro = await carroDoDonoOu404(supabase, perfil.id, carroId);
  if (!ehUuid(registroId)) notFound();

  const { data: registro } = await supabase
    .from("registros")
    .select(
      "id, tipo, titulo, data, km, notas, visibilidade, itens_registro(id, descricao, categoria, quantidade, valor_centavos, espaco, criado_em)",
    )
    .eq("id", registroId)
    .eq("carro_id", carro.id)
    .eq("dono_id", perfil.id)
    .order("criado_em", { referencedTable: "itens_registro" })
    .maybeSingle();
  if (!registro) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-6 text-texto-secundario">{nomeDoCarro(carro)}</p>
        <FormularioRegistro
          acao={salvarRegistro.bind(null, carro.id, registro.id)}
          valores={{
            tipo: registro.tipo,
            titulo: registro.titulo,
            data: registro.data,
            km: registro.km?.toString() ?? "",
            notas: registro.notas ?? "",
            visibilidade: registro.visibilidade,
          }}
          hoje={hojeEmSaoPaulo()}
          rotuloEnviar="Salvar alterações"
          voltarPara={`/garagem/carros/${carro.id}`}
        />
      </div>
      <section
        id="itens"
        aria-labelledby="titulo-itens"
        className="flex scroll-mt-6 flex-col gap-4"
      >
        <RolarParaAncora id="itens" />
        <h2 id="titulo-itens" className="text-xl font-bold">
          Itens
        </h2>
        <ListaItens
          carroId={carro.id}
          registroId={registro.id}
          itens={registro.itens_registro}
        />
        <FormularioItem
          acao={adicionarItem.bind(null, carro.id, registro.id)}
        />
      </section>
      <ExcluirComConfirmacao
        acao={apagarRegistro.bind(null, carro.id, registro.id)}
        rotulo="Excluir registro"
        aviso="Isso apaga o registro e o histórico de edições dele."
      />
    </div>
  );
}
