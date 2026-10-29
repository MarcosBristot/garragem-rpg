// Dados do controlador (LGPD art. 9º, III e IV) e do fornecedor (CDC).
// Enquanto houver "[preencher", as páginas legais mostram o aviso de
// rascunho. NÃO publicar o site com campos pendentes.

export const EMPRESA = {
  nome: "[preencher: razão social]",
  cnpj: "[preencher: CNPJ]",
  cidade: "[preencher: cidade/UF da sede]",
  email: "[preencher: e-mail de contato]",
  encarregado: "[preencher: nome do encarregado de dados]",
  emailEncarregado: "[preencher: e-mail do encarregado]",
  foro: "[preencher: comarca do foro]",
};

/** Versão dos Termos e da Política. Mudou o texto? Mude a data. */
export const VERSAO_TERMOS = "2026-10-29";
export const VIGENCIA = "29/10/2026";

export const PROVEDORES = {
  infraestrutura:
    "Supabase (banco de dados, autenticação e armazenamento) — região de hospedagem: [preencher]",
  email: "[preencher: provedor de envio de e-mail, quando contratado]",
};

export function dadosPendentes(): boolean {
  return [...Object.values(EMPRESA), ...Object.values(PROVEDORES)].some((v) =>
    v.includes("[preencher"),
  );
}
