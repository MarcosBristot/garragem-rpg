// Encontros (Fase 5). Validação do formulário, espelhando os CHECKs e o
// gatilho de `encontros`. Datas e horas no horário de São Paulo (sem
// horário de verão desde 2019: -03:00 fixo). Funções puras: o "agora" entra
// como parâmetro para o teste dar o mesmo resultado em qualquer dia.

export const TIPOS_ENCONTRO = {
  encontro: "Encontro",
  role: "Rolê (passeio em grupo)",
  track_day: "Track day",
  exposicao: "Exposição",
  outro: "Outro",
} as const;
export type TipoEncontro = keyof typeof TIPOS_ENCONTRO;

/** Durações oferecidas no formulário (horas). Máximo do banco: 72 h. */
export const DURACOES = {
  "1": "1 hora",
  "2": "2 horas",
  "3": "3 horas",
  "4": "4 horas",
  "6": "6 horas",
  "8": "8 horas",
  "12": "12 horas",
  "24": "1 dia",
  "48": "2 dias",
  "72": "3 dias",
} as const;

export const MAX_DIAS_ANTECEDENCIA = 180;
const FUSO = "-03:00";
const HORA = 60 * 60 * 1000;

export type DadosEncontro = {
  titulo: string;
  tipo: TipoEncontro;
  descricao: string | null;
  local_nome: string;
  cidade: string | null;
  lat: number;
  lng: number;
  inicio: string;
  fim: string;
};
export type ErrosEncontro = Partial<
  Record<
    | "titulo"
    | "tipo"
    | "descricao"
    | "local"
    | "cidade"
    | "ponto"
    | "inicio"
    | "duracao",
    string
  >
>;
export type ResultadoEncontro =
  { ok: true; dados: DadosEncontro } | { ok: false; erros: ErrosEncontro };

const texto = (v: unknown) => String(v ?? "").trim();

/** "2026-11-08T19:30" (horário de SP) → instante, ou null se inválido. */
export function instanteDeSaoPaulo(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const d = new Date(`${valor}:00${FUSO}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Instante → "2026-11-08T19:30" no horário de SP (para o campo do form). */
export function paraCampoDataHora(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * HORA);
  return d.toISOString().slice(0, 16);
}

function coordenada(v: unknown, limite: number): number | null {
  const n = Number(texto(v));
  if (texto(v) === "" || !Number.isFinite(n) || Math.abs(n) > limite)
    return null;
  return Math.round(n * 1e5) / 1e5; // ~1 m: o mesmo que o banco guarda
}

export function validarEncontro(
  entrada: Record<string, unknown>,
  agora: Date,
): ResultadoEncontro {
  const erros: ErrosEncontro = {};
  const titulo = texto(entrada.titulo);
  const tipo = texto(entrada.tipo);
  const descricao = texto(entrada.descricao);
  const local = texto(entrada.local_nome);
  const cidade = texto(entrada.cidade);
  const lat = coordenada(entrada.lat, 90);
  const lng = coordenada(entrada.lng, 180);
  const inicio = instanteDeSaoPaulo(texto(entrada.inicio));
  const duracao = texto(entrada.duracao);

  if (titulo.length < 3 || titulo.length > 80) {
    erros.titulo = "De 3 a 80 caracteres.";
  }
  if (!Object.hasOwn(TIPOS_ENCONTRO, tipo)) erros.tipo = "Escolha um tipo.";
  if (descricao.length > 1000) erros.descricao = "Máximo de 1.000 caracteres.";
  if (local.length < 2 || local.length > 120) {
    erros.local = "Diga o lugar (ex.: Estacionamento do Parque X).";
  }
  if (cidade.length > 80) erros.cidade = "Máximo de 80 caracteres.";
  if (lat === null || lng === null) {
    erros.ponto = "Toque no mapa para marcar o ponto de encontro.";
  }
  if (!inicio) {
    erros.inicio = "Informe dia e hora.";
  } else if (inicio.getTime() <= agora.getTime()) {
    erros.inicio = "O encontro precisa ser no futuro.";
  } else if (
    inicio.getTime() >
    agora.getTime() + MAX_DIAS_ANTECEDENCIA * 24 * HORA
  ) {
    erros.inicio = "No máximo 6 meses de antecedência.";
  }
  if (!Object.hasOwn(DURACOES, duracao)) erros.duracao = "Escolha a duração.";

  if (
    Object.keys(erros).length > 0 ||
    !inicio ||
    lat === null ||
    lng === null
  ) {
    return { ok: false, erros };
  }
  return {
    ok: true,
    dados: {
      titulo,
      tipo: tipo as TipoEncontro,
      descricao: descricao || null,
      local_nome: local,
      cidade: cidade || null,
      lat,
      lng,
      inicio: inicio.toISOString(),
      fim: new Date(inicio.getTime() + Number(duracao) * HORA).toISOString(),
    },
  };
}

/** Duração em horas entre início e fim (para preencher o form de edição). */
export function duracaoEmHoras(inicio: string, fim: string): string {
  const h = Math.round((Date.parse(fim) - Date.parse(inicio)) / HORA);
  return Object.hasOwn(DURACOES, String(h)) ? String(h) : "4";
}

/** "sáb., 8 de nov. · 19:30" no horário de São Paulo. */
export function quandoEncontro(iso: string): string {
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${dia} · ${hora}`;
}

/** Link "Como chegar" (OpenStreetMap, sem rastreio). */
export function linkComoChegar(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}#map=16/${lat}/${lng}`;
}

/** O encontro já começou (está acontecendo ou acabou)? */
export function jaComecou(inicio: string, agora: Date = new Date()): boolean {
  return Date.parse(inicio) <= agora.getTime();
}

/** O encontro já terminou? (Não aceita mais presença.) */
export function jaTerminou(fim: string, agora: Date = new Date()): boolean {
  return Date.parse(fim) <= agora.getTime();
}
