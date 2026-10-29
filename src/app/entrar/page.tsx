import type { Metadata } from "next";
import Link from "next/link";
import { Cartao } from "@/components/formulario";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar · Garagem RPG" };

// Página estática: não lê a sessão, então carrega instantaneamente.
export default function PaginaEntrar() {
  return (
    <Cartao>
      <h1 className="mb-6 text-4xl">Entrar</h1>
      <FormularioEntrar />
      <p className="mt-6 text-sm text-texto-secundario">
        Ao criar seu perfil, você vai aceitar os{" "}
        <Link href="/termos" className="text-destaque underline">
          Termos de Serviço
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" className="text-destaque underline">
          Política de Privacidade
        </Link>
        . Usamos seu e-mail só para enviar o código de acesso e avisos da conta.
      </p>
    </Cartao>
  );
}
