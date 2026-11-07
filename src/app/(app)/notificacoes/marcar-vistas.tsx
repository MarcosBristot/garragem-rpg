"use client";

import { useEffect } from "react";
import { marcarNotificacoesVistas } from "./acoes";

// Abriu a página: o que está na tela conta como visto. Roda depois de
// mostrar (a página ainda destaca o que era novo nesta visita).
export function MarcarVistas() {
  useEffect(() => {
    marcarNotificacoesVistas().catch(() => undefined);
  }, []);
  return null;
}
