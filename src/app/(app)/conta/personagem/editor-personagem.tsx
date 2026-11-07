"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Botao } from "@/components/formulario";
import { Boneco } from "@/components/personagem/boneco";
import {
  CAMPOS,
  personagemPadrao,
  type Personagem,
} from "@/dominio/personagem";
import { salvarPersonagem, type EstadoPersonagem } from "./acoes";

const TITULOS: Record<keyof Personagem, string> = {
  pele: "Tom de pele",
  cabelo: "Cabelo",
  corCabelo: "Cor do cabelo",
  roupa: "Roupa",
  corRoupa: "Cor da roupa e do acessório",
  corCalca: "Cor da calça",
  acessorio: "Acessório",
};

export function EditorPersonagem({
  inicial,
  nomeUsuario,
}: {
  inicial: Personagem;
  nomeUsuario: string;
}) {
  // As escolhas vivem no estado (prévia 3D ao vivo). O React 19 reseta o
  // form depois da ação e os radios voltariam às marcações iniciais:
  // a `key` recria o form a cada resposta, já marcado pelo estado.
  const [personagem, setPersonagem] = useState(inicial);
  const [estado, enviar, enviando] = useActionState<EstadoPersonagem, FormData>(
    salvarPersonagem,
    { versao: 0 },
  );

  function escolher<C extends keyof Personagem>(
    campo: C,
    valor: Personagem[C],
  ) {
    setPersonagem((atual) => ({ ...atual, [campo]: valor }));
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-start">
      <div className="flex flex-col gap-3 md:sticky md:top-24">
        <Boneco
          personagem={personagem}
          rotulo="Prévia do seu personagem"
          className="aspect-square w-full"
        />
        <p className="text-center text-sm text-texto-apagado">
          Arraste para girar.
        </p>
      </div>

      <form key={estado.versao} action={enviar} className="flex flex-col gap-6">
        {(Object.keys(CAMPOS) as (keyof Personagem)[]).map((campo) => (
          <fieldset key={campo} className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium">
              {TITULOS[campo]}
            </legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CAMPOS[campo]).map(([valor, opcao]) => {
                const cor = "cor" in opcao ? (opcao.cor as string) : null;
                const id = `${campo}-${valor}`;
                return (
                  <label
                    key={valor}
                    htmlFor={id}
                    title={opcao.rotulo}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-borda-campo px-3 text-sm has-checked:border-destaque has-checked:bg-destaque/10 has-focus-visible:ring-2 has-focus-visible:ring-destaque ${cor ? "min-w-11 justify-center px-2" : ""}`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name={campo}
                      value={valor}
                      checked={personagem[campo] === valor}
                      onChange={() =>
                        escolher(campo, valor as Personagem[typeof campo])
                      }
                      className="sr-only"
                    />
                    {cor ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="size-6 rounded-md border border-texto/25"
                          style={{ backgroundColor: cor }}
                        />
                        <span className="sr-only">{opcao.rotulo}</span>
                      </>
                    ) : (
                      opcao.rotulo
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {estado.erro ? (
          <p role="alert" className="text-sm text-erro">
            {estado.erro}
          </p>
        ) : null}
        {estado.salvo ? (
          <p role="status" className="text-sm text-condicao">
            Personagem salvo.{" "}
            <Link href={`/u/${nomeUsuario}`} className="underline">
              Ver no perfil público
            </Link>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Botao type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar personagem"}
          </Botao>
          <Botao
            type="button"
            variante="secundario"
            onClick={() => setPersonagem(personagemPadrao(crypto.randomUUID()))}
          >
            Sortear
          </Botao>
        </div>
      </form>
    </div>
  );
}
