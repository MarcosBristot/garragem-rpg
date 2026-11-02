import "server-only";

// Registro de falhas no log do servidor (Vercel). LGPD: só a ETAPA e o
// tipo/código do erro, nunca mensagens livres, chaves de foto, e-mails,
// notas ou qualquer dado digitado pela pessoa.

export function registrarFalha(etapa: string, erro: unknown): void {
  const e = erro as {
    name?: unknown;
    code?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  } | null;
  const detalhes = [
    typeof e?.name === "string" ? e.name : null,
    typeof e?.code === "string" ? `código ${e.code}` : null,
    typeof e?.$metadata?.httpStatusCode === "number"
      ? `HTTP ${e.$metadata.httpStatusCode}`
      : null,
  ].filter(Boolean);
  console.error(`[falha] ${etapa}: ${detalhes.join(" · ") || "desconhecida"}`);
}
