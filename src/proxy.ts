import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Roda antes de cada página: renova o token de acesso quando ele expira
// e devolve os cookies novos. Não decide quem pode ver o quê; isso é
// papel das páginas (no servidor) e da RLS no banco.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista, cabecalhos) => {
          // Atualiza a requisição (para as páginas lerem o token novo)
          // e a resposta (para o navegador guardar).
          for (const { name, value } of lista) request.cookies.set(name, value);
          resposta = NextResponse.next({ request });
          for (const { name, value, options } of lista) {
            resposta.cookies.set(name, value, options);
          }
          // Impede que um CDN guarde a sessão de um usuário e sirva a outro.
          for (const [nome, valor] of Object.entries(cabecalhos)) {
            resposta.headers.set(nome, valor);
          }
        },
      },
    },
  );

  await supabase.auth.getClaims();
  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
