// Regra de visibilidade de um registro, escrita como função pura.
// É a especificação que as políticas RLS do banco vão espelhar: o banco
// é quem garante a regra; esta função serve para as páginas do servidor
// e para os testes documentarem o comportamento esperado.

export type Visibilidade = "privado" | "publico_sem_valor" | "publico";

export const VISIBILIDADE_PADRAO: Visibilidade = "privado";

export interface ItemRegistro {
  descricao: string;
  categoria: string;
  quantidade: number;
  /** Em centavos, para evitar erros de arredondamento com float. */
  valorCentavos: number | null;
}

export interface Registro {
  id: string;
  donoId: string;
  visibilidade: Visibilidade;
  titulo: string;
  /** Pode conter CPF/endereço: nunca sai para quem não é dono. */
  notas: string | null;
  itens: ItemRegistro[];
}

export type ItemVisivel = Omit<ItemRegistro, "valorCentavos"> & {
  valorCentavos?: number | null;
};

export type RegistroVisivel = Omit<Registro, "notas" | "itens"> & {
  notas?: string | null;
  itens: ItemVisivel[];
};

/**
 * Devolve o que `visualizadorId` pode ver do registro, ou `null` se nada.
 * `visualizadorId` é `null` para visitante não logado.
 * Campos ocultos são removidos (não zerados), para não vazarem em JSON.
 */
export function registroVisivelPara(
  registro: Registro,
  visualizadorId: string | null,
): RegistroVisivel | null {
  if (registro.donoId === visualizadorId) return registro;
  if (registro.visibilidade === "privado") return null;

  const mostrarValores = registro.visibilidade === "publico";
  return {
    id: registro.id,
    donoId: registro.donoId,
    visibilidade: registro.visibilidade,
    titulo: registro.titulo,
    itens: registro.itens.map(({ valorCentavos, ...item }) =>
      mostrarValores ? { ...item, valorCentavos } : item,
    ),
  };
}
