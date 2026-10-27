import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./tipos";

// Crie um cliente novo a cada requisição: um cliente compartilhado
// misturaria a sessão de usuários diferentes.
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) => {
          try {
            for (const { name, value, options } of lista) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components não podem gravar cookies. Tudo bem:
            // o proxy (src/proxy.ts) já renovou a sessão nesta requisição.
          }
        },
      },
    },
  );
}
