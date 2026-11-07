// Configuração do mapa (Fase 5). Imagens: OpenFreeMap (grátis, sem chave,
// sem cookies; dados do OpenStreetMap). O navegador de quem abre o mapa
// baixa as imagens de lá (o IP chega ao OpenFreeMap: ver /privacidade).

/** Estilo claro e discreto, combina com o tema de dia. */
export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";

/**
 * O MapLibre 6 roda o desenho num "worker" (arquivo separado). Depois do
 * bundle, o caminho padrão dele não existe: servimos uma cópia versionada
 * em public/mapa/ (um teste confere que bate com a versão instalada).
 */
export const VERSAO_MAPLIBRE = "6.16.0";
export const URL_WORKER_MAPA = `/mapa/maplibre-gl-worker-${VERSAO_MAPLIBRE}.js`;

/** Brasil inteiro, quando ainda não há encontros para enquadrar. */
export const CENTRO_BRASIL: [number, number] = [-51.9, -14.2];
export const ZOOM_BRASIL = 3.2;
