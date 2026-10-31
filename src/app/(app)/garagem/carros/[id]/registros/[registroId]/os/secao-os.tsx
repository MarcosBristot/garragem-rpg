import { EnviarFoto } from "@/components/enviar-foto";
import { ExcluirComConfirmacao } from "@/components/excluir-com-confirmacao";
import { FotoAssinada } from "@/components/foto-assinada";
import { centavosParaCampo } from "@/dominio/dinheiro";
import { hojeEmSaoPaulo } from "@/lib/datas";
import { enviarFotoOS, removerOS, salvarOS } from "./acoes";
import { FormularioOS } from "./formulario-os";

type OS = {
  oficina: string | null;
  data: string | null;
  km: number | null;
  total_centavos: number | null;
  foto_chave: string | null;
} | null;

export function SecaoOS({
  carroId,
  registroId,
  os,
}: {
  carroId: string;
  registroId: string;
  os: OS;
}) {
  return (
    <section aria-labelledby="titulo-os" className="flex flex-col gap-4">
      <h2 id="titulo-os" className="text-3xl">
        Ordem de serviço
      </h2>
      <p className="text-sm text-texto-secundario">
        <strong className="text-texto">Sempre privada.</strong> A OS pode ter
        CPF, endereço e telefone: ela nunca aparece em páginas públicas nem em
        cards. Guarde aqui como comprovante do serviço.
      </p>

      {os?.foto_chave ? (
        <FotoAssinada
          chave={os.foto_chave}
          alt="Foto da ordem de serviço"
          sizes="(min-width: 448px) 400px, 90vw"
          className="max-h-96 w-fit rounded-2xl object-contain"
        />
      ) : null}
      <EnviarFoto
        acao={enviarFotoOS.bind(null, carroId, registroId)}
        rotulo={os?.foto_chave ? "Trocar foto da OS" : "Anexar foto da OS"}
      />

      <FormularioOS
        acao={salvarOS.bind(null, carroId, registroId)}
        hoje={hojeEmSaoPaulo()}
        valores={{
          oficina: os?.oficina ?? "",
          data: os?.data ?? "",
          km: os?.km?.toString() ?? "",
          total:
            os?.total_centavos != null
              ? centavosParaCampo(os.total_centavos)
              : "",
        }}
      />

      {os ? (
        <ExcluirComConfirmacao
          acao={removerOS.bind(null, carroId, registroId)}
          rotulo="Remover OS"
          aviso="Isso apaga a foto e os dados da ordem de serviço."
        />
      ) : null}
    </section>
  );
}
