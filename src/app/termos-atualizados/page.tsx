import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Cartao } from "@/components/formulario";
import { MUDANCAS_TERMOS, VIGENCIA } from "@/lib/empresa";
import { exigirPerfil } from "@/lib/sessao";
import { FormularioAceite } from "./formulario-aceite";

export const metadata: Metadata = {
  title: "Termos atualizados · Garagem RPG",
  robots: { index: false },
};

export default function PaginaTermosAtualizados() {
  return (
    <Cartao>
      <h1 className="text-4xl">Atualizamos os termos</h1>
      <p className="mt-2 text-texto-secundario">
        Versão vigente desde {VIGENCIA}. O que mudou:
      </p>
      <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-sm">
        {MUDANCAS_TERMOS.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        Leia na íntegra:{" "}
        <Link
          href="/termos"
          target="_blank"
          className="text-destaque underline"
        >
          Termos de Serviço
        </Link>{" "}
        e{" "}
        <Link
          href="/privacidade"
          target="_blank"
          className="text-destaque underline"
        >
          Política de Privacidade
        </Link>
        <span className="sr-only"> (abrem em nova aba)</span>.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <Conteudo />
        </Suspense>
      </div>
      <p className="mt-6 border-t border-borda pt-4 text-sm text-texto-secundario">
        Não concorda? Em{" "}
        <Link href="/conta" className="text-destaque underline">
          Conta
        </Link>{" "}
        você pode baixar seus dados e excluir a conta sem aceitar.
      </p>
    </Cartao>
  );
}

async function Conteudo() {
  // Só confere login e perfil (aceite pendente é justamente o caso aqui).
  await exigirPerfil({ aceiteOpcional: true });
  return <FormularioAceite />;
}
