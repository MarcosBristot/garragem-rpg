// Campos da ordem de serviço (OS). Todos opcionais: a pessoa pode anexar
// só a foto e preencher depois. Valida no formato brasileiro (km com ponto
// de milhar, total em reais) e espelha os CHECKs de `ordens_servico`.
// Hoje preenchidos à mão; depois, a leitura por IA preenche o rascunho e
// a pessoa revisa nesta mesma validação.

import { reaisParaCentavos } from "./dinheiro";

export interface DadosOS {
  oficina: string | null;
  data: string | null;
  km: number | null;
  totalCentavos: number | null;
}

export type ErrosOS = Partial<Record<keyof DadosOS, string>>;

export type ResultadoOS =
  { ok: true; dados: DadosOS } | { ok: false; erros: ErrosOS };

function dataValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return (
    dt.getUTCFullYear() === a &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function validarOS(
  entrada: { oficina: unknown; data: unknown; km: unknown; total: unknown },
  hoje: string,
): ResultadoOS {
  const oficina = String(entrada.oficina ?? "").trim();
  const data = String(entrada.data ?? "").trim();
  const kmTexto = String(entrada.km ?? "").replace(/[.\s]/g, "");
  const total = reaisParaCentavos(String(entrada.total ?? ""));

  const erros: ErrosOS = {};
  if (oficina.length > 120) erros.oficina = "Máximo de 120 caracteres.";
  if (data !== "" && !dataValida(data)) {
    erros.data = "Informe uma data válida.";
  } else if (data > hoje) {
    erros.data = "A data não pode estar no futuro.";
  }
  const km = kmTexto === "" ? null : Number(kmTexto);
  if (km !== null && (!Number.isInteger(km) || km < 0 || km > 9_999_999)) {
    erros.km = "Use só números, sem casas decimais.";
  }
  if (total === undefined)
    erros.totalCentavos = "Use o formato 180 ou 1.234,56.";

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      oficina: oficina || null,
      data: data || null,
      km,
      totalCentavos: total ?? null,
    },
  };
}
