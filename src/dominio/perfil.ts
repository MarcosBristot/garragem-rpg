// Validação do perfil, espelhando os CHECKs da tabela `perfis`.
// O banco continua sendo a garantia; aqui é para dar mensagens claras.

export interface DadosPerfil {
  nomeUsuario: string;
  nomeExibicao: string | null;
  cidade: string | null;
}

export type ErrosPerfil = Partial<Record<keyof DadosPerfil, string>>;

export type ResultadoPerfil =
  { ok: true; dados: DadosPerfil } | { ok: false; erros: ErrosPerfil };

const NOME_USUARIO = /^[a-z0-9_]{3,30}$/;

function textoOpcional(valor: unknown): string | null {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

export function validarPerfil(entrada: {
  nomeUsuario: unknown;
  nomeExibicao: unknown;
  cidade: unknown;
}): ResultadoPerfil {
  const dados: DadosPerfil = {
    nomeUsuario: String(entrada.nomeUsuario ?? "")
      .trim()
      .toLowerCase(),
    nomeExibicao: textoOpcional(entrada.nomeExibicao),
    cidade: textoOpcional(entrada.cidade),
  };

  const erros: ErrosPerfil = {};
  if (!NOME_USUARIO.test(dados.nomeUsuario)) {
    erros.nomeUsuario =
      "Use de 3 a 30 caracteres: letras minúsculas, números ou _.";
  }
  if (dados.nomeExibicao && dados.nomeExibicao.length > 60) {
    erros.nomeExibicao = "Máximo de 60 caracteres.";
  }
  if (dados.cidade && dados.cidade.length > 80) {
    erros.cidade = "Máximo de 80 caracteres.";
  }

  return Object.keys(erros).length > 0
    ? { ok: false, erros }
    : { ok: true, dados };
}
