import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA, VIGENCIA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Termos de Serviço · Garagem RPG",
  description: "Regras de uso do Garagem RPG.",
};

export default function PaginaTermos() {
  return (
    <article className="texto-legal">
      <p className="rotulo">Vigentes desde {VIGENCIA}</p>
      <h1 className="mt-2 mb-6 text-5xl text-texto">Termos de Serviço</h1>

      <p>
        Estes termos regem o uso do Garagem RPG, oferecido por{" "}
        <strong>{EMPRESA.nome}</strong> (CNPJ {EMPRESA.cnpj}). Ao criar o
        perfil, você declara que leu e aceita estes termos e a{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O Garagem RPG é um diário de manutenção e modificações de veículos, com
        recursos sociais. Funções marcadas como “em breve” ainda não existem e
        podem mudar ou não ser lançadas.
      </p>

      <h2>2. Quem pode usar</h2>
      <p>
        Pessoas com 18 anos ou mais. Você é responsável por manter o acesso ao
        seu e-mail, que é a chave da sua conta.
      </p>

      <h2>3. Seu conteúdo</h2>
      <ul>
        <li>
          O que você registra continua sendo seu. Você nos autoriza a guardar e
          exibir esse conteúdo apenas para prestar o serviço e conforme a
          visibilidade que escolher.
        </li>
        <li>
          Não publique conteúdo ilegal, ofensivo, que viole direitos de
          terceiros (incluindo imagens e marcas sem autorização) ou dados
          pessoais de outras pessoas.
        </li>
        <li>
          Podemos remover conteúdo ou suspender contas que descumpram estes
          termos, avisando o motivo sempre que possível.
        </li>
      </ul>

      <h2>4. Informação, não laudo</h2>
      <p>
        Registros, totais e futuros atributos, níveis e “Condição” são
        informativos, calculados a partir do que você registra. Não são laudo
        técnico, vistoria nem avaliação de preço do veículo. Siga sempre o
        manual do fabricante e profissionais qualificados.
      </p>

      <h2>5. Preço</h2>
      <p>
        Hoje o uso é gratuito. Se lançarmos recursos pagos, preço e condições
        serão informados antes da contratação, que dependerá do seu aceite. Nada
        será cobrado sem a sua confirmação. Veja a{" "}
        <Link href="/reembolso">Política de Reembolso</Link>.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        A marca, o visual e o código do Garagem RPG são nossos. Nomes e marcas
        de fabricantes de veículos pertencem aos seus titulares e aparecem
        apenas para identificar o carro do usuário.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o serviço no ar e os dados seguros, mas podem
        ocorrer interrupções. Recomendamos baixar seus dados de vez em quando,
        na página <Link href="/conta">Conta</Link>. Nossa responsabilidade segue
        o Código de Defesa do Consumidor.
      </p>

      <h2>8. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento, na página Conta; os
        dados são apagados como descrito na Política de Privacidade.
      </p>

      <h2>9. Mudanças nos termos</h2>
      <p>
        Se mudarmos algo importante, avisaremos com antecedência e pediremos
        novo aceite quando necessário.
      </p>

      <h2>10. Lei e foro</h2>
      <p>
        Vale a lei brasileira. Fica eleito o foro de {EMPRESA.foro}, sem
        prejuízo do direito do consumidor de propor ação no foro do seu
        domicílio. Contato: {EMPRESA.email}.
      </p>
    </article>
  );
}
