// Filtros do ranking vindos da URL (?classe=hatch&onde=brasil). Valor
// inválido cai no padrão: a página nunca quebra por um link mexido.
import { ehClasse, type Classe } from "./classe";

export type Onde = "cidade" | "brasil";

export type FiltrosRanking = { classe: Classe; onde: Onde };

export function lerFiltros(
  params: { classe?: unknown; onde?: unknown },
  classePadrao: Classe,
): FiltrosRanking {
  return {
    classe: ehClasse(params.classe) ? params.classe : classePadrao,
    onde: params.onde === "brasil" ? "brasil" : "cidade",
  };
}

/** "1º", "2º"… (posição empatada repete o número). */
export function rotuloPosicao(posicao: number): string {
  return `${posicao}º`;
}
