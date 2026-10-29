"use client";

import { useId, useState, useTransition } from "react";
import { Botao, Campo } from "@/components/formulario";
import { reduzirNoNavegador } from "@/lib/fotos/reduzir-no-navegador";

export type ResultadoEnvio = { erro?: string } | void;

/**
 * Escolher, pré-visualizar e enviar uma foto. A foto é reduzida no
 * navegador e reprocessada no servidor (onde perde EXIF/GPS).
 */
export function EnviarFoto({
  acao,
  rotulo,
  pedirDescricao = false,
}: {
  acao: (form: FormData) => Promise<ResultadoEnvio>;
  rotulo: string;
  pedirDescricao?: boolean;
}) {
  const id = useId();
  const [foto, setFoto] = useState<{ blob: Blob; previa: string } | null>(null);
  const [erro, setErro] = useState<string>();
  const [enviando, iniciar] = useTransition();

  async function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    setErro(undefined);
    try {
      const blob = await reduzirNoNavegador(arquivo);
      if (foto) URL.revokeObjectURL(foto.previa);
      setFoto({ blob, previa: URL.createObjectURL(blob) });
    } catch {
      setErro("Não foi possível ler essa imagem. Tente outra foto.");
    }
  }

  function enviar(form: FormData) {
    if (!foto) return;
    const dados = new FormData();
    dados.set("foto", foto.blob, "foto.jpg");
    dados.set("descricao", String(form.get("descricao") ?? ""));
    iniciar(async () => {
      const resultado = await acao(dados);
      if (resultado?.erro) {
        setErro(resultado.erro);
      } else {
        URL.revokeObjectURL(foto.previa);
        setFoto(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* O input fica escondido; o <label> é o botão (teclado incluso). */}
      <input
        id={`${id}-arquivo`}
        type="file"
        accept="image/*"
        className="peer sr-only"
        onChange={escolher}
        aria-describedby={erro ? `${id}-erro` : undefined}
      />
      <label
        htmlFor={`${id}-arquivo`}
        className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-full border border-borda px-5 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque hover:bg-borda/50"
      >
        {foto ? "Trocar foto" : rotulo}
      </label>

      {foto ? (
        <form action={enviar} className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.previa}
            alt="Prévia da foto escolhida"
            className="max-h-64 w-fit rounded-2xl object-contain"
          />
          {pedirDescricao ? (
            <Campo
              id={`${id}-descricao`}
              name="descricao"
              rotulo="Descrição da foto (opcional)"
              maxLength={200}
              dica="Ajuda quem usa leitor de tela. Ex.: Filtro de óleo novo ao lado do velho."
            />
          ) : null}
          <div className="flex gap-3">
            <Botao type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar foto"}
            </Botao>
            <Botao
              type="button"
              variante="secundario"
              disabled={enviando}
              onClick={() => {
                URL.revokeObjectURL(foto.previa);
                setFoto(null);
              }}
            >
              Cancelar
            </Botao>
          </div>
        </form>
      ) : null}

      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-red-300">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
