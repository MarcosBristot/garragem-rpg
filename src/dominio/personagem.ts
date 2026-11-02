// Personagem 3D "de blocos" de cada pessoa. O banco guarda só as escolhas
// (chaves curtas, em perfis.personagem); as cores e o modelo moram aqui e
// nos componentes. Design próprio: nada copiado de jogos (regra 6).
//
// Quem nunca editou ganha um boneco gerado do próprio id: sempre o mesmo,
// diferente entre pessoas, sem precisar gravar nada.

const opcoes = <T extends Record<string, { rotulo: string }>>(o: T) => o;

export const PELES = opcoes({
  t1: { rotulo: "Tom 1", cor: "#F3D2B3" },
  t2: { rotulo: "Tom 2", cor: "#E2B48E" },
  t3: { rotulo: "Tom 3", cor: "#C68A5E" },
  t4: { rotulo: "Tom 4", cor: "#9C6440" },
  t5: { rotulo: "Tom 5", cor: "#704429" },
  t6: { rotulo: "Tom 6", cor: "#4A2C1C" },
});

export const CABELOS = opcoes({
  raspado: { rotulo: "Raspado" },
  curto: { rotulo: "Curto" },
  topete: { rotulo: "Topete" },
  longo: { rotulo: "Longo" },
  coque: { rotulo: "Coque" },
});

export const CORES_CABELO = opcoes({
  preto: { rotulo: "Preto", cor: "#1E1B1A" },
  castanho: { rotulo: "Castanho", cor: "#4B3022" },
  ruivo: { rotulo: "Ruivo", cor: "#9A4A22" },
  loiro: { rotulo: "Loiro", cor: "#D9B26A" },
  grisalho: { rotulo: "Grisalho", cor: "#B9B6B0" },
  azul: { rotulo: "Azul", cor: "#3B6FD6" },
  rosa: { rotulo: "Rosa", cor: "#D65A9A" },
});

export const ROUPAS = opcoes({
  camiseta: { rotulo: "Camiseta" },
  jaqueta: { rotulo: "Jaqueta" },
  macacao: { rotulo: "Macacão de oficina" },
});

export const CORES = opcoes({
  ambar: { rotulo: "Âmbar", cor: "#F5A524" },
  vermelho: { rotulo: "Vermelho", cor: "#D64545" },
  azul: { rotulo: "Azul", cor: "#2F6FD1" },
  verde: { rotulo: "Verde", cor: "#3FA36B" },
  roxo: { rotulo: "Roxo", cor: "#7B5CD6" },
  branco: { rotulo: "Branco", cor: "#E8E8EA" },
  cinza: { rotulo: "Cinza", cor: "#7A7F8A" },
  grafite: { rotulo: "Grafite", cor: "#2B2D33" },
});

export const ACESSORIOS = opcoes({
  nenhum: { rotulo: "Nenhum" },
  bone: { rotulo: "Boné" },
  capacete: { rotulo: "Capacete" },
  oculos: { rotulo: "Óculos escuros" },
  fone: { rotulo: "Fone de ouvido" },
});

export type Personagem = {
  pele: keyof typeof PELES;
  cabelo: keyof typeof CABELOS;
  corCabelo: keyof typeof CORES_CABELO;
  roupa: keyof typeof ROUPAS;
  corRoupa: keyof typeof CORES;
  corCalca: keyof typeof CORES;
  acessorio: keyof typeof ACESSORIOS;
};

/** Cada campo e a lista de opções válidas para ele. */
export const CAMPOS: {
  [C in keyof Personagem]: Record<Personagem[C], { rotulo: string }>;
} = {
  pele: PELES,
  cabelo: CABELOS,
  corCabelo: CORES_CABELO,
  roupa: ROUPAS,
  corRoupa: CORES,
  corCalca: CORES,
  acessorio: ACESSORIOS,
};

const NOMES_CAMPOS = Object.keys(CAMPOS) as (keyof Personagem)[];

/** Hash FNV-1a de 32 bits: rápido, estável entre servidor e navegador. */
function hash(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Boneco padrão de uma pessoa, derivado do id (determinístico). */
export function personagemPadrao(semente: string): Personagem {
  const escolher = <C extends keyof Personagem>(campo: C): Personagem[C] => {
    const chaves = Object.keys(CAMPOS[campo]) as Personagem[C][];
    return chaves[hash(`${semente}:${campo}`) % chaves.length];
  };
  return {
    pele: escolher("pele"),
    cabelo: escolher("cabelo"),
    corCabelo: escolher("corCabelo"),
    roupa: escolher("roupa"),
    corRoupa: escolher("corRoupa"),
    corCalca: escolher("corCalca"),
    // Metade nasce sem acessório: o boneco padrão fica mais limpo.
    acessorio:
      hash(`${semente}:temAcessorio`) % 2 === 0
        ? "nenhum"
        : escolher("acessorio"),
  };
}

/**
 * Confere dados vindos de formulário ou do banco. Todos os campos são
 * obrigatórios e só valem chaves conhecidas (Object.hasOwn: "toString" não
 * passa). Devolve um objeto novo só com os campos do personagem.
 */
export function validarPersonagem(entrada: unknown): Personagem | null {
  if (
    typeof entrada !== "object" ||
    entrada === null ||
    Array.isArray(entrada)
  ) {
    return null;
  }
  const dados = entrada as Record<string, unknown>;
  const saida: Partial<Record<keyof Personagem, string>> = {};
  for (const campo of NOMES_CAMPOS) {
    const valor = dados[campo];
    if (typeof valor !== "string" || !Object.hasOwn(CAMPOS[campo], valor)) {
      return null;
    }
    saida[campo] = valor;
  }
  return saida as Personagem;
}

/** O que está salvo no perfil, ou o boneco padrão se não houver nada válido. */
export function personagemDoPerfil(
  salvo: unknown,
  perfilId: string,
): Personagem {
  return validarPersonagem(salvo) ?? personagemPadrao(perfilId);
}

export type CoresPersonagem = {
  pele: string;
  cabelo: string;
  roupa: string;
  calca: string;
};

export function coresDoPersonagem(p: Personagem): CoresPersonagem {
  return {
    pele: PELES[p.pele].cor,
    cabelo: CORES_CABELO[p.corCabelo].cor,
    roupa: CORES[p.corRoupa].cor,
    // Macacão cobre as pernas com a mesma cor do tronco.
    calca:
      p.roupa === "macacao" ? CORES[p.corRoupa].cor : CORES[p.corCalca].cor,
  };
}
