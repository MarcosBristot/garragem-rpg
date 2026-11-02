// Limites de envio de foto, usados no navegador e no servidor (sem
// "server-only" de propósito).
//
// A Vercel recusa (erro 413) qualquer requisição acima de 4,5 MB, e a foto
// viaja dentro de um formulário junto com outros campos: 4 MB deixa folga.
// O navegador já reduz a foto antes de enviar; isto é a última barreira.
export const BYTES_MAX = 4 * 1024 * 1024;
export const ROTULO_BYTES_MAX = "4 MB";
