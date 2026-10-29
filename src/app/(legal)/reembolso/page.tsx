import type { Metadata } from "next";
import { EMPRESA, VIGENCIA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Reembolso · Garagem RPG",
  description: "Cancelamento e reembolso de planos pagos do Garagem RPG.",
};

export default function PaginaReembolso() {
  return (
    <article className="texto-legal">
      <p className="rotulo">Vigente desde {VIGENCIA}</p>
      <h1 className="mt-2 mb-6 text-5xl text-texto">Política de Reembolso</h1>

      <p>
        <strong>Hoje o Garagem RPG não cobra nada</strong>, então não há o que
        reembolsar. Esta política já deixa claro como será quando existirem
        planos pagos.
      </p>

      <h2>1. Direito de arrependimento</h2>
      <p>
        Em compras pela internet, você pode desistir em até{" "}
        <strong>7 dias</strong> a partir da contratação, sem precisar explicar o
        motivo (Código de Defesa do Consumidor, art. 49). O reembolso é
        integral.
      </p>

      <h2>2. Cancelamento da assinatura</h2>
      <ul>
        <li>Você pode cancelar quando quiser, sem multa.</li>
        <li>
          Depois dos 7 dias, o cancelamento interrompe as próximas cobranças e o
          plano segue ativo até o fim do período já pago.
        </li>
      </ul>

      <h2>3. Cobranças indevidas</h2>
      <p>
        Cobrança duplicada ou por erro nosso é devolvida integralmente, assim
        que confirmada.
      </p>

      <h2>4. Como pedir e prazos</h2>
      <p>
        Escreva para {EMPRESA.email}. O estorno é feito pelo mesmo meio de
        pagamento: Pix em até [preencher] dias úteis; no cartão, conforme o
        ciclo da operadora, em geral até duas faturas.
      </p>
    </article>
  );
}
