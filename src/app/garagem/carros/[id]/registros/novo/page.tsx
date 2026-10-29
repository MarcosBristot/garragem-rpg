import type { Metadata } from "next";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { VISIBILIDADE_PADRAO } from "@/dominio/visibilidade";
import { carroDoDonoOu404, nomeDoCarro } from "@/lib/carros";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { exigirPerfil } from "@/lib/sessao";
import { salvarRegistro } from "../acoes";
import { FormularioRegistro } from "../formulario-registro";

export const metadata: Metadata = { title: "Novo registro · Garagem RPG" };

export default function PaginaNovoRegistro({
  params,
}: PageProps<"/garagem/carros/[id]/registros/novo">) {
  return (
    <Cartao>
      <h1 className="text-2xl font-bold">Novo registro</h1>
      <Suspense
        fallback={<p className="mt-6 text-texto-secundario">Carregando…</p>}
      >
        {params.then(({ id }) => (
          <Conteudo carroId={id} />
        ))}
      </Suspense>
    </Cartao>
  );
}

async function Conteudo({ carroId }: { carroId: string }) {
  const { supabase, perfil } = await exigirPerfil();
  const carro = await carroDoDonoOu404(supabase, perfil.id, carroId);
  const hoje = hojeEmSaoPaulo();

  return (
    <>
      <p className="mb-6 text-texto-secundario">{nomeDoCarro(carro)}</p>
      <FormularioRegistro
        acao={salvarRegistro.bind(null, carro.id, null)}
        valores={{
          tipo: "manutencao",
          titulo: "",
          data: hoje,
          km: "",
          notas: "",
          visibilidade: VISIBILIDADE_PADRAO,
        }}
        hoje={hoje}
        rotuloEnviar="Adicionar registro"
        voltarPara={`/garagem/carros/${carro.id}`}
      />
    </>
  );
}
