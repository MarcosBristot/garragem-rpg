import Link from "next/link";
import { usuarioLogado } from "@/lib/sessao";

// Sino do topo, com a bolinha de notificações novas. Lê a sessão, então
// fica dentro de <Suspense> (o fallback é o sino sem número).

function Icone() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

const estilo =
  "relative grid size-11 shrink-0 place-items-center rounded-md text-texto-secundario hover:bg-superficie-2 hover:text-texto focus-visible:outline-2 focus-visible:outline-destaque";

export function SinoSemNumero() {
  return (
    <Link href="/notificacoes" aria-label="Notificações" className={estilo}>
      <Icone />
    </Link>
  );
}

export async function SinoNotificacoes() {
  const { supabase, usuarioId } = await usuarioLogado();
  if (!usuarioId) return <SinoSemNumero />;
  const { data } = await supabase.rpc("notificacoes_novas");
  const novas = data ?? 0;
  return (
    <Link
      href="/notificacoes"
      aria-label={
        novas > 0
          ? `Notificações: ${novas} ${novas === 1 ? "nova" : "novas"}`
          : "Notificações"
      }
      className={estilo}
    >
      <Icone />
      {novas > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-md border-2 border-texto bg-destaque sombra-botao px-1 text-[0.65rem] leading-5 font-bold text-white"
        >
          {novas > 9 ? "9+" : novas}
        </span>
      ) : null}
    </Link>
  );
}
