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
export const VERSAO_TERMOS = "2026-11-02.2";
export const VIGENCIA = "02/11/2026";

/** O que mudou nesta versão (mostrado a quem precisa aceitar de novo). */
export const MUDANCAS_TERMOS = [
  "Curtidas e comentários: você pode curtir e comentar posts. Comentários e o total de curtidas aparecem para quem pode ver o post; o dono do post pode apagar comentários nele.",
  "Feed: agora você pode publicar posts com até 4 fotos de um carro público. Só quem tem conta vê, e o post some do feed se o carro voltar a ser privado.",
  "Seguir e bloquear: guardamos quem você segue e quem você bloqueou. Isso não aparece para outras pessoas, e quem é bloqueado não é avisado.",
  "Personagem: as escolhas do boneco do seu perfil (pele, cabelo, roupa, acessório) ficam públicas, como o resto do perfil.",
];

export const PROVEDORES = {
  infraestrutura:
    "Supabase (banco de dados, autenticação e armazenamento) — região de hospedagem: [preencher]",
  fotos:
    "Cloudflare R2 (armazenamento das fotos) — jurisdição dos dados: [preencher]",
  email: "[preencher: provedor de envio de e-mail, quando contratado]",
};

export function dadosPendentes(): boolean {
  return [...Object.values(EMPRESA), ...Object.values(PROVEDORES)].some((v) =>
    v.includes("[preencher"),
  );
}
