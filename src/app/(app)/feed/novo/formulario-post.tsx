"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { AreaTexto, Botao, Selecao } from "@/components/formulario";
import {
  MAX_DESCRICAO_FOTO,
  MAX_FOTOS_POST,
  MAX_LEGENDA,
} from "@/dominio/post";
import { reduzirNoNavegador } from "@/lib/fotos/reduzir-no-navegador";
import { adicionarFotoPost, criarPost } from "../acoes";

type FotoEscolhida = { blob: Blob; previa: string; descricao: string };

export function FormularioPost({ carros }: { carros: Record<string, string> }) {
  const id = useId();
  const router = useRouter();
  const [fotos, setFotos] = useState<FotoEscolhida[]>([]);
  const [erro, setErro] = useState<string>();
  const [erros, setErros] = useState<{ carro?: string; legenda?: string }>({});
  const [progresso, setProgresso] = useState<string>();
  const [enviando, iniciar] = useTransition();

  async function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = [...(evento.target.files ?? [])];
    evento.target.value = ""; // permite escolher o mesmo arquivo de novo
    const vagas = MAX_FOTOS_POST - fotos.length;
    if (arquivos.length > vagas) {
      setErro(`No máximo ${MAX_FOTOS_POST} fotos por post.`);
    } else {
      setErro(undefined);
    }
    const novas: FotoEscolhida[] = [];
    for (const arquivo of arquivos.slice(0, vagas)) {
      try {
        const blob = await reduzirNoNavegador(arquivo);
        novas.push({ blob, previa: URL.createObjectURL(blob), descricao: "" });
      } catch {
        setErro("Não foi possível ler uma das imagens. Tente outra foto.");
      }
    }
    setFotos((atuais) => [...atuais, ...novas]);
  }

  function remover(indice: number) {
    setFotos((atuais) => {
      URL.revokeObjectURL(atuais[indice].previa);
      return atuais.filter((_, i) => i !== indice);
    });
  }

  function descrever(indice: number, descricao: string) {
    setFotos((atuais) =>
      atuais.map((f, i) => (i === indice ? { ...f, descricao } : f)),
    );
  }

  function dadosDaFoto(foto: FotoEscolhida) {
    const dados = new FormData();
    dados.set("foto", foto.blob, "foto.jpg");
    dados.set("descricao", foto.descricao);
    return dados;
  }

  function publicar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (fotos.length === 0) return;
    const campos = new FormData(evento.currentTarget);
    iniciar(async () => {
      setErro(undefined);
      setErros({});
      // 1ª foto junto com o post; as outras uma por vez (limite de 4,5 MB
      // por envio na hospedagem).
      setProgresso(
        fotos.length > 1
          ? `Enviando foto 1 de ${fotos.length}…`
          : "Publicando…",
      );
      const primeira = dadosDaFoto(fotos[0]);
      primeira.set("carro", String(campos.get("carro") ?? ""));
      primeira.set("legenda", String(campos.get("legenda") ?? ""));
      const resultado = await criarPost(primeira);
      if (!resultado.ok) {
        setProgresso(undefined);
        setErro(resultado.erro);
        setErros(resultado.erros ?? {});
        return;
      }
      let falhas = 0;
      for (let i = 1; i < fotos.length; i++) {
        setProgresso(`Enviando foto ${i + 1} de ${fotos.length}…`);
        const r = await adicionarFotoPost(
          resultado.postId,
          dadosDaFoto(fotos[i]),
        );
        if (r.erro) falhas++;
      }
      fotos.forEach((f) => URL.revokeObjectURL(f.previa));
      router.push(falhas > 0 ? `/feed?falhas=${falhas}` : "/feed");
    });
  }

  return (
    <form onSubmit={publicar} className="flex flex-col gap-5">
      <Selecao
        id={`${id}-carro`}
        name="carro"
        rotulo="Carro"
        opcoes={carros}
        required
        erro={erros.carro}
      />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">
          Fotos ({fotos.length} de {MAX_FOTOS_POST})
        </p>
        {fotos.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {fotos.map((foto, i) => (
              <li
                key={foto.previa}
                className="flex flex-col gap-2 rounded-2xl border border-borda p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.previa}
                  alt={`Prévia da foto ${i + 1}`}
                  className="aspect-square w-full rounded-xl object-cover"
                />
                <label className="flex flex-col gap-1 text-sm">
                  <span>Descrição (opcional)</span>
                  <input
                    value={foto.descricao}
                    maxLength={MAX_DESCRICAO_FOTO}
                    onChange={(e) => descrever(i, e.target.value)}
                    className="min-h-11 rounded-lg border border-borda-campo bg-fundo px-3 text-texto"
                  />
                </label>
                <Botao
                  type="button"
                  variante="secundario"
                  disabled={enviando}
                  onClick={() => remover(i)}
                  aria-label={`Remover foto ${i + 1}`}
                >
                  Remover
                </Botao>
              </li>
            ))}
          </ul>
        ) : null}
        {fotos.length < MAX_FOTOS_POST ? (
          <>
            <input
              id={`${id}-arquivos`}
              type="file"
              accept="image/*"
              multiple
              className="peer sr-only"
              onChange={escolher}
              disabled={enviando}
            />
            <label
              htmlFor={`${id}-arquivos`}
              className="inline-flex min-h-11 w-fit cursor-pointer items-center rounded-full border border-borda px-5 text-sm font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-destaque hover:bg-borda/50"
            >
              {fotos.length === 0 ? "Escolher fotos" : "Adicionar mais fotos"}
            </label>
          </>
        ) : null}
        <p className="text-sm text-texto-apagado">
          A localização (GPS) e outros dados escondidos das fotos são removidos
          antes de salvar. Evite fotos que mostrem a placa ou onde o carro fica.
        </p>
      </div>

      <AreaTexto
        id={`${id}-legenda`}
        name="legenda"
        rotulo="Legenda (opcional)"
        maxLength={MAX_LEGENDA}
        erro={erros.legenda}
      />

      {erro ? (
        <p role="alert" className="text-sm text-red-300">
          {erro}
        </p>
      ) : null}
      {progresso ? (
        <p role="status" className="text-sm text-texto-secundario">
          {progresso}
        </p>
      ) : null}

      {/* Sem foto (inclusive antes do JavaScript carregar) não publica. */}
      <Botao type="submit" disabled={enviando || fotos.length === 0}>
        {enviando ? "Publicando…" : "Publicar"}
      </Botao>
    </form>
  );
}
