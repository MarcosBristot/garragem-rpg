// Fora de acoes.ts: arquivos "use server" só podem exportar funções async.

export type ValoresItem = Record<
  "descricao" | "categoria" | "quantidade" | "valor" | "espaco",
  string
>;

export const VALORES_ITEM_VAZIOS: ValoresItem = {
  descricao: "",
  categoria: "peca",
  quantidade: "1",
  valor: "",
  espaco: "",
};
