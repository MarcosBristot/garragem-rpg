import type { Metadata } from "next";
import { VIGENCIA } from "@/lib/empresa";

export const metadata: Metadata = {
  title: "Política de Cookies · Garagem RPG",
  description: "Quais cookies e armazenamentos locais o Garagem RPG usa.",
};

// Mantenha a tabela igual ao que o site grava de verdade. Antes de incluir
// qualquer script de análise ou anúncio: consentimento prévio e esta página.
export default function PaginaCookies() {
  return (
    <article className="texto-legal">
      <p className="rotulo">Vigente desde {VIGENCIA}</p>
      <h1 className="mt-2 mb-6 text-5xl text-texto">Política de Cookies</h1>

      <p>
        Usamos o mínimo: só o necessário para você entrar na conta. Não há
        cookies de publicidade, de análise de audiência nem de redes sociais.
        Por serem estritamente necessários, eles não dependem de consentimento,
        mas você tem o direito de saber quais são.
      </p>

      <table>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tipo</th>
            <th scope="col">Para quê</th>
            <th scope="col">Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-…-auth-token</code>
            </td>
            <td>Cookie essencial</td>
            <td>Manter você conectado depois do código de acesso</td>
            <td>Até sair da conta ou a sessão expirar</td>
          </tr>
          <tr>
            <td>
              <code>aviso-cookies</code>
            </td>
            <td>Armazenamento local do navegador</td>
            <td>Lembrar que você já viu o aviso de cookies</td>
            <td>Até você limpar os dados do navegador</td>
          </tr>
        </tbody>
      </table>

      <h2>Como apagar</h2>
      <p>
        Sair da conta apaga o cookie de sessão. Você também pode apagar cookies
        e dados do site nas configurações do navegador. Sem o cookie de sessão,
        não é possível ficar conectado.
      </p>

      <h2>Fontes e terceiros</h2>
      <p>
        As fontes do site são servidas pelo próprio site, sem chamadas ao
        Google. A página inicial não carrega scripts de terceiros.
      </p>
    </article>
  );
}
