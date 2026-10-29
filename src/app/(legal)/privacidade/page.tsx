import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA, PROVEDORES, VIGENCIA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Privacidade · Garagem RPG",
  description: "Como o Garagem RPG trata seus dados pessoais, conforme a LGPD.",
};

// Escrita para descrever o que o sistema FAZ hoje. Mudou o tratamento de
// dados (ex.: fotos, feed, pagamentos)? Atualize esta página e VERSAO_TERMOS.
export default function PaginaPrivacidade() {
  return (
    <article className="texto-legal">
      <p className="rotulo">Vigente desde {VIGENCIA}</p>
      <h1 className="mt-2 mb-6 text-5xl text-texto">Política de Privacidade</h1>

      <p>
        Esta política explica, em linguagem simples, quais dados pessoais o
        Garagem RPG trata, para quê e quais são os seus direitos, conforme a Lei
        Geral de Proteção de Dados (Lei nº 13.709/2018, a LGPD).
      </p>

      <h2>1. Quem cuida dos seus dados</h2>
      <p>
        O controlador é <strong>{EMPRESA.nome}</strong>, CNPJ {EMPRESA.cnpj},
        com sede em {EMPRESA.cidade}. Contato geral: {EMPRESA.email}.
      </p>
      <p>
        Encarregado pelo tratamento de dados (DPO):{" "}
        <strong>{EMPRESA.encarregado}</strong> — {EMPRESA.emailEncarregado}.
      </p>

      <h2>2. Quais dados tratamos</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Dado</th>
            <th scope="col">Para quê</th>
            <th scope="col">Base legal (LGPD, art. 7º)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>E-mail</td>
            <td>Entrar na conta (código de acesso) e avisos sobre ela</td>
            <td>Execução de contrato (V)</td>
          </tr>
          <tr>
            <td>Nome de usuário, nome de exibição e cidade (opcional)</td>
            <td>Montar seu perfil</td>
            <td>Execução de contrato (V)</td>
          </tr>
          <tr>
            <td>Carros (marca, modelo, ano, apelido)</td>
            <td>Montar sua garagem</td>
            <td>Execução de contrato (V)</td>
          </tr>
          <tr>
            <td>Registros, itens, valores e notas do diário</td>
            <td>Guardar a história do carro e o histórico de edições</td>
            <td>Execução de contrato (V)</td>
          </tr>
          <tr>
            <td>Fotos do carro e dos registros, com descrição opcional</td>
            <td>Ilustrar a garagem e o diário</td>
            <td>Execução de contrato (V)</td>
          </tr>
          <tr>
            <td>Data e versão do aceite destes termos</td>
            <td>Comprovar o aceite</td>
            <td>
              Cumprimento de obrigação legal (II) e exercício de direitos (VI)
            </td>
          </tr>
          <tr>
            <td>Cookie de sessão</td>
            <td>Manter você conectado com segurança</td>
            <td>Execução de contrato (V)</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Não coletamos:</strong> localização, endereço de onde o carro
        fica, placa, CPF, dados de pagamento, contatos do celular nem dados de
        navegação para publicidade. Não pedimos mais do que o necessário
        (princípio da necessidade, art. 6º, III).
      </p>
      <p>
        <strong>Fotos sem localização:</strong> antes de salvar, removemos todos
        os metadados da foto (EXIF), incluindo coordenadas de GPS, modelo da
        câmera e data. As fotos ficam em armazenamento privado e só são exibidas
        por links temporários.
      </p>
      <p>
        <strong>Cuidado com as notas:</strong> elas são sempre privadas, mas
        evite escrever nelas dados pessoais de outras pessoas (por exemplo, o
        CPF ou o endereço de uma oficina ou de um vendedor).
      </p>

      <h2>3. O que fica público</h2>
      <ul>
        <li>Nome de usuário, nome de exibição e cidade do perfil.</li>
        <li>Carros que você marcar como públicos.</li>
        <li>
          Registros de carros públicos, conforme a visibilidade que você
          escolher em cada um: <em>privado</em> (só você vê),{" "}
          <em>público sem valores</em> ou <em>público</em>.
        </li>
      </ul>
      <p>
        Notas e histórico de edições <strong>nunca</strong> são públicos.
        Valores aparecem só em registros marcados como públicos. Essas regras
        são aplicadas no banco de dados, não apenas na tela.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>
        Não vendemos nem alugamos dados. Usamos fornecedores que tratam dados em
        nosso nome (operadores), apenas para o serviço funcionar:
      </p>
      <ul>
        <li>{PROVEDORES.infraestrutura}.</li>
        <li>{PROVEDORES.fotos}.</li>
        <li>{PROVEDORES.email}.</li>
      </ul>
      <p>
        Se algum desses fornecedores guardar dados fora do Brasil, a
        transferência segue o art. 33 da LGPD (por exemplo, por cláusulas
        contratuais). Também podemos fornecer dados quando a lei ou uma ordem
        judicial exigir.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Enquanto sua conta existir. Ao excluir a conta, apagamos na hora perfil,
        carros, registros, itens, notas e histórico. Cópias de segurança do
        provedor de infraestrutura são sobrescritas em até [preencher: prazo de
        retenção dos backups].
      </p>

      <h2>6. Seus direitos</h2>
      <p>Pelo art. 18 da LGPD, você pode, a qualquer momento:</p>
      <ul>
        <li>confirmar se tratamos seus dados e acessá-los;</li>
        <li>corrigir dados incompletos ou errados;</li>
        <li>pedir a portabilidade (baixar uma cópia);</li>
        <li>pedir a eliminação dos dados;</li>
        <li>saber com quem compartilhamos;</li>
        <li>revogar consentimentos, quando houver.</li>
      </ul>
      <p>
        Na página <Link href="/conta">Conta</Link> você mesmo{" "}
        <strong>corrige seu perfil</strong>, <strong>baixa seus dados</strong>{" "}
        (arquivo JSON) e <strong>exclui a conta</strong>. Para os demais
        pedidos, escreva para o encarregado ({EMPRESA.emailEncarregado});
        respondemos em até 15 dias. Você também pode reclamar à Autoridade
        Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>7. Segurança</h2>
      <p>
        Conexões criptografadas (HTTPS), acesso sem senha (código por e-mail),
        regras de acesso por linha no banco de dados e registro de edições.
        Nenhum sistema é infalível: se houver um incidente que possa trazer
        risco a você, avisaremos você e a ANPD, como manda a lei.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Usamos apenas o cookie essencial de sessão. Detalhes na{" "}
        <Link href="/cookies">Política de Cookies</Link>.
      </p>

      <h2>9. Menores de idade</h2>
      <p>
        O Garagem RPG é destinado a pessoas com 18 anos ou mais. Se soubermos
        que uma conta é de menor de idade, ela será excluída.
      </p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Se mudarmos algo importante, avisaremos no site e pediremos novo aceite
        quando a lei exigir. A data de vigência fica no topo desta página.
      </p>
    </article>
  );
}
