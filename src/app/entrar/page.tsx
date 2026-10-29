import type { Metadata } from "next";
import { Cartao } from "@/components/formulario";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar · Garagem RPG" };

// Página estática: não lê a sessão, então carrega instantaneamente.
export default function PaginaEntrar() {
  return (
    <Cartao>
      <h1 className="mb-6 text-4xl">Entrar</h1>
      <FormularioEntrar />
    </Cartao>
  );
}
