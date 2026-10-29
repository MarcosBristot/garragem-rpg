"use client";

import { useEffect } from "react";

// O navegador tenta rolar até #ancora assim que a página chega, mas com
// streaming (<Suspense>) a seção ainda não existe nesse momento.
// Este componente fica dentro da seção e rola quando ela aparece.
export function RolarParaAncora({ id }: { id: string }) {
  useEffect(() => {
    if (window.location.hash === `#${id}`) {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }
  }, [id]);
  return null;
}
