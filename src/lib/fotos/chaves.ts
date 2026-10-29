import type { Tamanho } from "./processar";

// Caminhos das fotos no armazenamento. Tudo de um usuário fica sob
// u/<id>/, e tudo de um carro sob u/<id>/c/<carro>/: apagar a conta ou o
// carro vira "apagar um prefixo" (LGPD: excluir também os arquivos).
// No banco guardamos a CHAVE, nunca a URL: trocar de provedor é só copiar.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function exigirUuid(...ids: string[]) {
  // Ids viram pedaços de caminho: nada de "../" ou "/" vindo de fora.
  for (const id of ids) {
    if (!UUID.test(id)) throw new Error("Id inválido para caminho de foto.");
  }
}

export function prefixoUsuario(usuarioId: string): string {
  exigirUuid(usuarioId);
  return `u/${usuarioId}/`;
}

export function prefixoCarro(usuarioId: string, carroId: string): string {
  exigirUuid(carroId);
  return `${prefixoUsuario(usuarioId)}c/${carroId}/`;
}

export function prefixoRegistro(
  usuarioId: string,
  carroId: string,
  registroId: string,
): string {
  exigirUuid(registroId);
  return `${prefixoCarro(usuarioId, carroId)}r/${registroId}/`;
}

export function chaveCapa(usuarioId: string, carroId: string, fotoId: string) {
  exigirUuid(fotoId);
  return `${prefixoCarro(usuarioId, carroId)}capa/${fotoId}`;
}

export function chaveFotoRegistro(
  usuarioId: string,
  carroId: string,
  registroId: string,
  fotoId: string,
) {
  exigirUuid(fotoId);
  return `${prefixoRegistro(usuarioId, carroId, registroId)}${fotoId}`;
}

/** Arquivo de um tamanho: "<chave>-feed.webp". */
export function arquivoDaChave(chave: string, tamanho: Tamanho): string {
  return `${chave}-${tamanho}.webp`;
}
