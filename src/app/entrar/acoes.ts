"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoEntrar = {
  etapa: "email" | "codigo";
  email: string;
  erro?: string;
};

// Uma ação, duas etapas: pede o código e depois confere.
// Nunca registrar e-mail ou código em log (LGPD).
export async function entrar(
  estado: EstadoEntrar,
  form: FormData,
): Promise<EstadoEntrar> {
  if (form.get("voltar")) return { etapa: "email", email: "" };

  const supabase = await criarClienteServidor();

  if (estado.etapa === "email") {
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { etapa: "email", email, erro: "Digite um e-mail válido." };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      return {
        etapa: "email",
        email,
        erro:
          error.status === 429
            ? "Muitas tentativas. Espere alguns minutos."
            : "Não foi possível enviar o código. Tente de novo.",
      };
    }
    return { etapa: "codigo", email };
  }

  const codigo = String(form.get("codigo") ?? "").replace(/\s/g, "");
  // O tamanho vem da config do Supabase (6 no local; a nuvem pode usar
  // até 10): aceitar a faixa toda evita quebrar o login entre ambientes.
  if (!/^\d{6,10}$/.test(codigo)) {
    return {
      ...estado,
      erro: "Digite o código numérico que chegou no e-mail.",
    };
  }
  const { error } = await supabase.auth.verifyOtp({
    email: estado.email,
    token: codigo,
    type: "email",
  });
  if (error) return { ...estado, erro: "Código inválido ou expirado." };

  // /garagem manda para /perfil/novo se o perfil ainda não existe.
  redirect("/garagem");
}
