"use client";

import { useActionState } from "react";
import { Botao } from "@/components/formulario";
import { MAX_COMENTARIO } from "@/dominio/comentario";
import { comentar, type EstadoComentario } from "../../acoes";

export function FormularioComentario({ postId }: { postId: string }) {
  const [estado, enviar, enviando] = useActionState<EstadoComentario, FormData>(
    comentar.bind(null, postId),
    { versao: 0 },
  );
  const idErro = `comentario-erro-${postId}`;

  return (
    // `key`: depois de comentar, o campo volta vazio; com erro, volta com o
    // texto digitado (o React 19 limpa o form depois de cada envio).
    <form key={estado.versao} action={enviar} className="flex flex-col gap-2">
      <label htmlFor={`comentario-${postId}`} className="text-sm font-medium">
        Seu comentário
      </label>
      <textarea
        id={`comentario-${postId}`}
        name="texto"
        rows={3}
        required
        maxLength={MAX_COMENTARIO}
        defaultValue={estado.texto}
        aria-invalid={estado.erro ? true : undefined}
        aria-describedby={estado.erro ? idErro : undefined}
        className="rounded-lg border border-borda-campo bg-fundo px-3 py-2 text-texto"
      />
      {estado.erro ? (
        <p id={idErro} role="alert" className="text-sm text-red-300">
          {estado.erro}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando} className="self-end">
        {enviando ? "Enviando…" : "Comentar"}
      </Botao>
    </form>
  );
}
