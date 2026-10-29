import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { Cartao } from "@/components/formulario";
import { carroDoDonoOu404, nomeDoCarro } from "@/lib/carros";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";
import { ehUuid } from "@/lib/uuid";
import { apagarRegistro, salvarRegistro } from "../../acoes";
import { FormularioRegistro } from "../../formulario-registro";

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
    .select("id, tipo, titulo, data, km, notas, visibilidade")
    .eq("id", registroId)
    .eq("carro_id", carro.id)
    .eq("dono_id", perfil.id)
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
      <ExcluirComConfirmacao
        acao={apagarRegistro.bind(null, carro.id, registro.id)}
        rotulo="Excluir registro"
        aviso="Isso apaga o registro e o histórico de edições dele."
      />
    </div>
  );
}
