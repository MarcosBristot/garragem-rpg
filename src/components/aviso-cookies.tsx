"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// Só usamos o cookie essencial de sessão: a LGPD não exige consentimento,
// mas exige transparência. Por isso é um aviso com "Entendi", não um
// "Aceitar/Recusar". A escolha fica no localStorage (não cria cookie).

const CHAVE = "aviso-cookies";
const ouvintes = new Set<() => void>();
let dispensadoNestaVisita = false;

function ler(): boolean {
  try {
    return window.localStorage.getItem(CHAVE) === "visto";
  } catch {
    return false; // navegação privada pode bloquear o localStorage
  }
}

function assinar(aviso: () => void) {
  ouvintes.add(aviso);
  return () => ouvintes.delete(aviso);
}

function marcarVisto() {
  try {
    window.localStorage.setItem(CHAVE, "visto");
  } catch {
    // sem armazenamento: o aviso some só nesta visita
  }
  dispensadoNestaVisita = true;
  ouvintes.forEach((o) => o());
}

export function AvisoCookies() {
  // No servidor e no primeiro render, considera "visto" (não pisca).
  const visto = useSyncExternalStore(
    assinar,
    () => dispensadoNestaVisita || ler(),
    () => true,
  );
  if (visto) return null;

  return (
    <section
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 text-sm shadow-2xl sm:bottom-4 sm:flex-row sm:items-center"
    >
      <p className="text-texto-secundario">
        Usamos só o cookie essencial que mantém você conectado. Nada de
        rastreadores.{" "}
        <Link href="/cookies" className="text-destaque underline">
          Saiba mais
        </Link>
      </p>
      <button
        type="button"
        onClick={marcarVisto}
        className="min-h-11 shrink-0 rounded-full bg-destaque px-5 font-semibold text-fundo hover:bg-destaque/90"
      >
        Entendi
      </button>
    </section>
  );
}
