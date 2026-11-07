import Link from "next/link";
import {
  bloquear,
  desbloquear,
  deixarDeSeguir,
  seguir,
} from "@/app/(app)/pessoas-acoes";
import { Botao } from "@/components/formulario";
import { usuarioLogado } from "@/lib/sessao";

// Seguir / bloquear no perfil público. A página em si é lida sem sessão
// (clientePublico); só estes botões olham quem está vendo.
export async function AcoesPerfil({ perfilId }: { perfilId: string }) {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) {
    return (
      <Link href="/entrar" className="text-sm text-destaque underline">
        Entre para seguir
      </Link>
    );
  }
  if (usuarioId === perfilId) {
    return (
      <Link
        href="/conta"
        className="inline-flex min-h-11 items-center rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
      >
        Editar perfil
      </Link>
    );
  }

  const [{ data: sigo }, { data: bloqueei }] = await Promise.all([
    supabase
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", usuarioId)
      .eq("seguido_id", perfilId)
      .maybeSingle(),
    supabase
      .from("bloqueios")
      .select("bloqueado_id")
      .eq("bloqueador_id", usuarioId)
      .eq("bloqueado_id", perfilId)
      .maybeSingle(),
  ]);

  if (bloqueei) {
    return (
      <form
        action={desbloquear.bind(null, perfilId)}
        className="flex flex-col gap-2"
      >
        <p className="text-sm text-texto-secundario">
          Você bloqueou esta pessoa: vocês não veem os posts um do outro.
        </p>
        <Botao type="submit" variante="secundario" className="self-start">
          Desbloquear
        </Botao>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sigo ? (
        <form action={deixarDeSeguir.bind(null, perfilId)}>
          <Botao type="submit" variante="secundario">
            Seguindo ✓
          </Botao>
        </form>
      ) : (
        <form action={seguir.bind(null, perfilId)}>
          <Botao type="submit">Seguir</Botao>
        </form>
      )}
      <form action={bloquear.bind(null, perfilId)}>
        <Botao type="submit" variante="perigo">
          Bloquear
        </Botao>
      </form>
    </div>
  );
}
