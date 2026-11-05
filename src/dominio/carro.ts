// Validação do carro, espelhando os CHECKs da tabela `carros`.
// Função pura: o ano atual entra como parâmetro em vez de ler o relógio,
// para o teste dar o mesmo resultado em qualquer data.

import { erroDaClasse, type Classe } from "./classe";

export interface DadosCarro {
  marca: string;
  modelo: string;
  ano: number | null;
  apelido: string | null;
  publico: boolean;
  /** Potência de fábrica em cv, informada pelo dono (atributo Potência). */
  potencia_cv: number | null;
  /** Liga do ranking (vazio = fora do ranking). */
  classe: Classe | null;
}

export type ErrosCarro = Partial<Record<keyof DadosCarro, string>>;

export type ResultadoCarro =
  { ok: true; dados: DadosCarro } | { ok: false; erros: ErrosCarro };

/** Primeiro automóvel patenteado; também é o limite do banco. */
const ANO_MINIMO = 1886;
/** Mesmo limite do CHECK de carros.potencia_cv. */
const CV_MAXIMO = 2000;

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

export function validarCarro(
  entrada: {
    marca: unknown;
    modelo: unknown;
    ano: unknown;
    apelido: unknown;
    publico: unknown;
    potencia_cv?: unknown;
    classe?: unknown;
  },
  anoAtual: number,
): ResultadoCarro {
  const anoTexto = texto(entrada.ano);
  const cvTexto = texto(entrada.potencia_cv);
  const classeTexto = texto(entrada.classe);
  const dados: DadosCarro = {
    marca: texto(entrada.marca),
    modelo: texto(entrada.modelo),
    ano: anoTexto === "" ? null : Number(anoTexto),
    apelido: texto(entrada.apelido) || null,
    // Checkbox HTML: vem "on" quando marcado e nada quando não.
    publico: entrada.publico === "on" || entrada.publico === true,
    potencia_cv: cvTexto === "" ? null : Number(cvTexto),
    // Conferida logo abaixo (erroDaClasse) antes de ser usada.
    classe: classeTexto === "" ? null : (classeTexto as Classe),
  };

  const erros: ErrosCarro = {};
  if (dados.marca.length < 1 || dados.marca.length > 40) {
    erros.marca = "Informe a marca (até 40 caracteres).";
  }
  if (dados.modelo.length < 1 || dados.modelo.length > 60) {
    erros.modelo = "Informe o modelo (até 60 caracteres).";
  }
  if (
    dados.ano !== null &&
    (!Number.isInteger(dados.ano) ||
      dados.ano < ANO_MINIMO ||
      dados.ano > anoAtual + 1)
  ) {
    erros.ano = `Use um ano entre ${ANO_MINIMO} e ${anoAtual + 1}.`;
  }
  if (
    dados.potencia_cv !== null &&
    (!Number.isInteger(dados.potencia_cv) ||
      dados.potencia_cv < 1 ||
      dados.potencia_cv > CV_MAXIMO)
  ) {
    erros.potencia_cv = `Use um número inteiro de 1 a ${CV_MAXIMO}.`;
  }
  const erroClasse = erroDaClasse(
    dados.classe,
    erros.ano ? null : dados.ano,
    anoAtual,
  );
  if (erroClasse) erros.classe = erroClasse;
  if (dados.apelido && dados.apelido.length > 40) {
    erros.apelido = "Máximo de 40 caracteres.";
  }

  return Object.keys(erros).length > 0
    ? { ok: false, erros }
    : { ok: true, dados };
}
