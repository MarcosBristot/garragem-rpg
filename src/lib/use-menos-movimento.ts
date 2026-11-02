"use client";

import { useSyncExternalStore } from "react";

// true quando a pessoa pediu ao sistema "reduzir movimento": as cenas 3D
// ficam paradas (sem giro automático nem animação).
const consulta = "(prefers-reduced-motion: reduce)";

function assinar(aviso: () => void) {
  const m = window.matchMedia(consulta);
  m.addEventListener("change", aviso);
  return () => m.removeEventListener("change", aviso);
}

export function useMenosMovimento(): boolean {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}
