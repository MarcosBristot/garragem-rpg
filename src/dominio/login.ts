// Mensagem para quem não recebeu o código, conforme o status devolvido pelo
// serviço de login. Falha nossa (5xx, ex.: SMTP recusou) não pode parecer
// erro de quem digitou.
export function mensagemFalhaEnvio(status: number | undefined): string {
  if (status === 429) return "Muitas tentativas. Espere alguns minutos.";
  if (status !== undefined && status >= 500) {
    return "O envio de e-mails está com problema agora. Tente de novo em alguns minutos.";
  }
  return "Não foi possível enviar o código. Confira o e-mail e tente de novo.";
}
