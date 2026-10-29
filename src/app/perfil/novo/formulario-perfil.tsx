"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CamposPerfil } from "@/components/campos-perfil";
import { Botao } from "@/components/formulario";
import { criarPerfil, type EstadoPerfil } from "./acoes";

const inicial: EstadoPerfil = {
  valores: { nome_usuario: "", nome_exibicao: "", cidade: "" },
  erros: {},
};

export function FormularioPerfil() {
  const [estado, acao, enviando] = useActionState(criarPerfil, inicial);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <CamposPerfil valores={estado.valores} erros={estado.erros} />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="aceite"
          className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"
        >
          <input
            id="aceite"
            name="aceite"
            type="checkbox"
            required
            aria-invalid={estado.erros.aceite ? true : undefined}
            aria-describedby={estado.erros.aceite ? "aceite-erro" : undefined}
            className="mt-0.5 size-5 shrink-0 accent-destaque"
          />
          <span>
            Tenho 18 anos ou mais e li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="text-destaque underline"
            >
              Termos de Serviço
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="text-destaque underline"
            >
              Política de Privacidade
            </Link>
            <span className="sr-only"> (abrem em nova aba)</span>.
          </span>
        </label>
        {estado.erros.aceite ? (
          <p id="aceite-erro" className="text-sm text-red-300">
            {estado.erros.aceite}
          </p>
        ) : null}
      </div>
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Criar perfil"}
      </Botao>
    </form>
  );
}
