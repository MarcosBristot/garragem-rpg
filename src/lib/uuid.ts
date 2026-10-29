const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids da URL são texto livre: confira antes de mandar ao banco. */
export function ehUuid(valor: string): boolean {
  return UUID.test(valor);
}
