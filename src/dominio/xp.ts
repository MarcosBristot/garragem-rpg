// XP e nível do carro. Os pontos são gravados SÓ pelo banco (triggers em
// supabase/migrations/*_eventos_xp.sql); aqui ficam a tabela para exibir
// ("como ganhar XP") e a curva de nível, função pura e testada.
// Dinheiro gasto não entra em nada disto (regra de domínio).

export type AcaoXp =
  "manutencao" | "modificacao" | "item" | "foto" | "ordem_servico";

/** Mesmos valores de private.regra_xp() no banco (o teste confere a lista). */
export const REGRAS_XP: Record<
  AcaoXp,
  { rotulo: string; pontos: number; limiteDia: number }
> = {
  manutencao: { rotulo: "Manutenção registrada", pontos: 30, limiteDia: 3 },
  modificacao: { rotulo: "Modificação registrada", pontos: 20, limiteDia: 3 },
  item: { rotulo: "Peça ou serviço detalhado", pontos: 5, limiteDia: 10 },
  foto: { rotulo: "Foto no registro", pontos: 5, limiteDia: 6 },
  ordem_servico: {
    rotulo: "Ordem de serviço anexada",
    pontos: 15,
    limiteDia: 2,
  },
};

/**
 * XP total para chegar ao nível L. Cada nível pede um pouco mais:
 * nível 2 = 100, nível 3 = 250, nível 4 = 450, nível 5 = 700…
 */
export function xpParaNivel(nivel: number): number {
  if (nivel <= 1) return 0;
  return 25 * (nivel - 1) * (nivel + 2);
}

/** Maior nível cujo XP mínimo já foi alcançado (começa no 1). */
export function nivelDoXp(xp: number): number {
  if (!(xp > 0)) return 1;
  // Inversa da curva; o ajuste corrige arredondamento de ponto flutuante.
  let nivel = Math.max(1, Math.floor((-1 + Math.sqrt(9 + (4 * xp) / 25)) / 2));
  while (xpParaNivel(nivel + 1) <= xp) nivel++;
  while (nivel > 1 && xpParaNivel(nivel) > xp) nivel--;
  return nivel;
}

export type Progresso = {
  xp: number;
  nivel: number;
  /** XP já feito dentro do nível atual. */
  noNivel: number;
  /** XP que o nível atual pede até o próximo. */
  doNivel: number;
  /** 0–100, para a barra. */
  porcento: number;
};

export function progressoXp(xp: number): Progresso {
  const total = Math.max(0, Math.floor(xp));
  const nivel = nivelDoXp(total);
  const inicio = xpParaNivel(nivel);
  const doNivel = xpParaNivel(nivel + 1) - inicio;
  const noNivel = total - inicio;
  return {
    xp: total,
    nivel,
    noNivel,
    doNivel,
    porcento: Math.floor((noNivel / doNivel) * 100),
  };
}

export type Recompensa = {
  /** XP que este registro rendeu (0 se o limite do dia já tinha batido). */
  ganho: number;
  nivelAntes: number;
  progresso: Progresso;
  subiuDeNivel: boolean;
};

/**
 * Recompensa mostrada logo depois de salvar um registro. Recebe o XP total
 * do carro agora e quanto dele veio do registro (os dois lidos do banco,
 * nunca da URL).
 */
export function recompensaDoRegistro(
  totalAgora: number,
  ganhoDoRegistro: number,
): Recompensa {
  const total = Math.max(0, Math.floor(totalAgora));
  const ganho = Math.min(total, Math.max(0, Math.floor(ganhoDoRegistro)));
  const progresso = progressoXp(total);
  const nivelAntes = nivelDoXp(total - ganho);
  return {
    ganho,
    nivelAntes,
    progresso,
    subiuDeNivel: progresso.nivel > nivelAntes,
  };
}
