import "server-only";
import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import type { Database } from "./tipos";

/**
 * Cliente para páginas públicas: lê como visitante ANÔNIMO, sem cookies.
 * Mesmo que a página tenha um bug, o banco só entrega o que é público
 * (RLS + views *_publicos). Nunca use o cliente com sessão aqui: o dono
 * olhando a própria página pública veria dados privados nela.
 */
export async function clientePublico() {
  // Por requisição: as fotos usam URLs assinadas que expiram.
  await connection();
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
