"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Marca data-visivel quando o bloco entra na tela; o CSS faz a transição.
// Sem JavaScript, o bloco já nasce visível (nada some para ninguém).
export function Revelar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.revelar = "esperando";
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.dataset.revelar = "visivel";
          observador.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out data-[revelar=esperando]:translate-y-8 data-[revelar=esperando]:opacity-0 ${className}`}
    >
      {children}
    </div>
  );
}
