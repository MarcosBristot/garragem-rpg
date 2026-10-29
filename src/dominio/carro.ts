// Validação do carro, espelhando os CHECKs da tabela `carros`.
// Função pura: o ano atual entra como parâmetro em vez de ler o relógio,
// para o teste dar o mesmo resultado em qualquer data.

export interface DadosCarro {
  marca: string;
  modelo: string;
  ano: number | null;
  apelido: string | null;
  publico: boolean;
}

export type ErrosCarro = Partial<Record<keyof DadosCarro, string>>;

export type ResultadoCarro =
  { ok: true; dados: DadosCarro } | { ok: false; erros: ErrosCarro };

/** Primeiro automóvel patenteado; também é o limite do banco. */
const ANO_MINIMO = 1886;

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
  },
  anoAtual: number,
): ResultadoCarro {
  const anoTexto = texto(entrada.ano);
  const dados: DadosCarro = {
    marca: texto(entrada.marca),
    modelo: texto(entrada.modelo),
    ano: anoTexto === "" ? null : Number(anoTexto),
    apelido: texto(entrada.apelido) || null,
    // Checkbox HTML: vem "on" quando marcado e nada quando não.
    publico: entrada.publico === "on" || entrada.publico === true,
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
  if (dados.apelido && dados.apelido.length > 40) {
    erros.apelido = "Máximo de 40 caracteres.";
  }

  return Object.keys(erros).length > 0
    ? { ok: false, erros }
    : { ok: true, dados };
}
