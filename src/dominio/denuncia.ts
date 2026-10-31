// Denúncia de conteúdo público. Espelha os enums e CHECKs de `denuncias`.

export const MOTIVOS = {
  dados_pessoais: {
    rotulo: "Expõe dados pessoais",
    descricao: "CPF, endereço, placa ou onde o carro de alguém fica.",
  },
  ofensivo: {
    rotulo: "Conteúdo ofensivo",
    descricao: "Ódio, assédio, ameaça ou violência.",
  },
  direitos: {
    rotulo: "Viola direitos de terceiros",
    descricao: "Foto ou conteúdo de outra pessoa sem autorização.",
  },
  golpe: { rotulo: "Golpe ou spam", descricao: "Fraude, propaganda enganosa." },
  outro: { rotulo: "Outro motivo", descricao: "Explique nos detalhes." },
} as const;

export const ALVOS = { carro: "carro", perfil: "perfil", registro: "registro" };

export type Motivo = keyof typeof MOTIVOS;
export type Alvo = keyof typeof ALVOS;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ResultadoDenuncia =
  | {
      ok: true;
      dados: {
        alvoTipo: Alvo;
        alvoId: string;
        motivo: Motivo;
        detalhes: string | null;
      };
    }
  | { ok: false; erros: { alvo?: string; motivo?: string; detalhes?: string } };

export function validarDenuncia(entrada: {
  alvoTipo: unknown;
  alvoId: unknown;
  motivo: unknown;
  detalhes: unknown;
}): ResultadoDenuncia {
  const alvoTipo = String(entrada.alvoTipo ?? "");
  const alvoId = String(entrada.alvoId ?? "");
  const motivo = String(entrada.motivo ?? "");
  const detalhes = String(entrada.detalhes ?? "").trim();

  const erros: { alvo?: string; motivo?: string; detalhes?: string } = {};
  if (!Object.hasOwn(ALVOS, alvoTipo) || !UUID.test(alvoId)) {
    erros.alvo = "Não sabemos o que você quer denunciar.";
  }
  if (!Object.hasOwn(MOTIVOS, motivo)) {
    erros.motivo = "Escolha um motivo.";
  }
  if (detalhes.length > 1000) {
    erros.detalhes = "Máximo de 1.000 caracteres.";
  } else if (motivo === "outro" && detalhes.length === 0) {
    erros.detalhes = "Conte o que aconteceu.";
  }

  return Object.keys(erros).length > 0
    ? { ok: false, erros }
    : {
        ok: true,
        dados: {
          alvoTipo: alvoTipo as Alvo,
          alvoId,
          motivo: motivo as Motivo,
          detalhes: detalhes || null,
        },
      };
}
