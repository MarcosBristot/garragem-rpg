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
export const VERSAO_TERMOS = "2026-11-07.3";
export const VIGENCIA = "07/11/2026";

/** O que mudou nesta versão (mostrado a quem precisa aceitar de novo). */
export const MUDANCAS_TERMOS = [
  "Mapa de encontros: você pode criar encontros (nome, tipo, dia, hora e um ponto público no mapa) e confirmar presença. Só quem tem conta vê os encontros; de quem vai, só o número aparece. As imagens do mapa vêm do OpenFreeMap, que recebe o endereço IP de quem abre o mapa (sem cookies). O site nunca pede sua localização.",
  "Notificações: quem curte ou comenta seu post e quem começa a seguir você aparece nas suas notificações (com nome e foto de perfil). Do mesmo jeito, quando você curte, comenta ou segue alguém, essa pessoa fica sabendo. Bloqueios valem também aqui.",
  "Foto de perfil: você pode pôr uma foto (opcional). Ela fica pública como o resto do perfil e aparece nos seus posts e comentários. A localização (GPS) e outros dados escondidos são removidos antes de salvar.",
  "Ranking do mês: carros públicos com classe (hatch, sedã, SUV…) aparecem num ranking para quem tem conta, com seu nome de usuário, sua cidade e o XP ganho no mês. O XP conta registros privados, mas só o total aparece.",
  "E-mail: o código de acesso agora é enviado pelo Gmail (Google). Para isso, seu endereço de e-mail passa pelos servidores do Google, que podem ficar fora do Brasil.",
  'Conquistas: carros públicos mostram as conquistas desbloqueadas (por exemplo, "Primeira revisão"). A ficha usa totais do diário inteiro, inclusive de registros privados (como quantos registros existem); o conteúdo deles continua privado.',
  "Ficha RPG: carros públicos mostram nível e atributos (Potência, Estilo, Engenhosidade, Dedicação e Condição). São só números, calculados também a partir de registros privados; o conteúdo dos registros continua privado.",
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
  mapa: "OpenFreeMap (imagens do mapa, com dados do OpenStreetMap): recebe o endereço IP de quem abre o mapa, sem cookies",
  email:
    "Google (Gmail), para enviar o e-mail com o código de acesso — servidores fora do Brasil",
};

export function dadosPendentes(): boolean {
  return [...Object.values(EMPRESA), ...Object.values(PROVEDORES)].some((v) =>
    v.includes("[preencher"),
  );
}
