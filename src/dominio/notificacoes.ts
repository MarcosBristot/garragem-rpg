// Notificações agrupadas, como nas redes sociais: várias curtidas no mesmo
// post viram "Ana e mais 2 curtiram seu post"; novos seguidores juntos;
// cada comentário aparece sozinho (tem texto). Funções puras, testadas.

export type Notificacao = {
  tipo: "curtida" | "comentario" | "seguidor";
  ator_id: string;
  post_id: string | null;
  trecho: string | null;
  criado_em: string;
};

export type Grupo = {
  chave: string;
  tipo: Notificacao["tipo"];
  /** Quem fez, do mais recente para o mais antigo, sem repetir. */
  atores: string[];
  post_id: string | null;
  trecho: string | null;
  /** Data da ação mais recente do grupo. */
  criado_em: string;
  /** Alguma ação do grupo chegou depois da última visita. */
  novo: boolean;
};

export function agrupar(
  itens: readonly Notificacao[],
  vistasEm: string | null,
): Grupo[] {
  const limite = vistasEm ? Date.parse(vistasEm) : -Infinity;
  const grupos = new Map<string, Grupo>();
  const ordenados = [...itens].sort(
    (a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em),
  );
  ordenados.forEach((n, i) => {
    const chave =
      n.tipo === "curtida"
        ? `curtida:${n.post_id}`
        : n.tipo === "seguidor"
          ? "seguidor"
          : `comentario:${i}`;
    const novo = Date.parse(n.criado_em) > limite;
    const atual = grupos.get(chave);
    if (atual) {
      if (!atual.atores.includes(n.ator_id)) atual.atores.push(n.ator_id);
      atual.novo ||= novo;
    } else {
      grupos.set(chave, {
        chave,
        tipo: n.tipo,
        atores: [n.ator_id],
        post_id: n.post_id,
        trecho: n.trecho,
        criado_em: n.criado_em,
        novo,
      });
    }
  });
  return [...grupos.values()].sort(
    (a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em),
  );
}

/** "Ana", "Ana e Beto", "Ana e mais 2 pessoas". */
export function quem(nomes: readonly string[]): string {
  if (nomes.length <= 1) return nomes[0] ?? "Alguém";
  if (nomes.length === 2) return `${nomes[0]} e ${nomes[1]}`;
  return `${nomes[0]} e mais ${nomes.length - 1} pessoas`;
}

export function frase(grupo: Grupo, nomes: readonly string[]): string {
  const varios = grupo.atores.length > 1;
  switch (grupo.tipo) {
    case "curtida":
      return `${quem(nomes)} ${varios ? "curtiram" : "curtiu"} seu post`;
    case "comentario":
      return `${quem(nomes)} comentou: “${grupo.trecho ?? ""}”`;
    case "seguidor":
      return `${quem(nomes)} ${varios ? "começaram" : "começou"} a seguir você`;
  }
}
