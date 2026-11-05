"use client";

import { useEffect, useRef } from "react";
import { useMenosMovimento } from "@/lib/use-menos-movimento";
import {
  caminhoQuadro,
  cobrir,
  quadroDaRolagem,
  quadrosParaBaixar,
  TOTAL_QUADROS,
} from "./sequencia";

// Fundo da landing: o carro no campo de flores, girando conforme a rolagem.
// São imagens renderizadas no Blender (nenhum modelo 3D vai para o site).
// O 1º quadro vem como <picture> (rápido e funciona sem JavaScript); os
// demais chegam depois e entram num <canvas>. Quem pede menos movimento
// fica só com o 1º quadro.

const PARALELOS = 4; // downloads ao mesmo tempo

export function SequenciaCarro() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const semMovimento = useMenosMovimento();

  useEffect(() => {
    const tela = canvas.current;
    const ctx = tela?.getContext("2d");
    if (!tela || !ctx || semMovimento) return;

    const retrato = window.matchMedia("(orientation: portrait)").matches;
    const conjunto = retrato ? "mobile" : "desktop";
    const conexao = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    // Celular baixa metade dos quadros; com economia de dados, um terço.
    const passo = conexao?.saveData ? 3 : retrato ? 2 : 1;
    const fila = quadrosParaBaixar(TOTAL_QUADROS, passo);
    const prontas = new Map<number, HTMLImageElement>();
    let cancelado = false;
    let ultimo = -1;
    let atual = 0;
    let quadroPedido = 0;

    function baixarProximo() {
      const i = fila.shift();
      if (i === undefined || cancelado) return;
      const img = new Image();
      img.decoding = "async";
      img.src = caminhoQuadro(conjunto, i);
      img
        .decode()
        .then(() => {
          if (!cancelado) prontas.set(i, img);
        })
        .catch(() => undefined)
        .finally(baixarProximo);
    }
    // Os outros quadros só começam a baixar depois que a página carregou
    // (a abertura fica com uma imagem só) ou na primeira rolagem, o que
    // vier antes.
    let comecou = false;
    function comecar() {
      if (comecou || cancelado) return;
      comecou = true;
      for (let k = 0; k < PARALELOS; k++) baixarProximo();
    }
    function quandoOcioso() {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(comecar, { timeout: 2000 });
      } else {
        setTimeout(comecar, 300);
      }
    }
    if (document.readyState === "complete") quandoOcioso();
    else window.addEventListener("load", quandoOcioso, { once: true });
    window.addEventListener("scroll", comecar, { once: true, passive: true });

    function ajustarTamanho() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      tela!.width = Math.round(window.innerWidth * dpr);
      tela!.height = Math.round(window.innerHeight * dpr);
      ultimo = -1; // redesenha
    }
    ajustarTamanho();
    window.addEventListener("resize", ajustarTamanho);

    function progressoRolagem() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? window.scrollY / max : 0;
    }

    function quadro() {
      if (cancelado) return;
      // Persegue a rolagem com suavidade (sem "pulos" de quadro).
      atual += (progressoRolagem() - atual) * 0.18;
      const i = quadroDaRolagem(atual, TOTAL_QUADROS, (k) => prontas.has(k));
      if (i >= 0 && i !== ultimo) {
        const img = prontas.get(i)!;
        const r = cobrir(
          img.naturalWidth,
          img.naturalHeight,
          tela!.width,
          tela!.height,
          retrato ? 0.55 : 0.5,
        );
        ctx!.drawImage(img, r.x, r.y, r.l, r.a);
        ultimo = i;
        tela!.dataset.pronto = "1"; // esconde o <picture> embaixo
      }
      quadroPedido = requestAnimationFrame(quadro);
    }
    quadroPedido = requestAnimationFrame(quadro);

    return () => {
      cancelado = true;
      cancelAnimationFrame(quadroPedido);
      window.removeEventListener("resize", ajustarTamanho);
      window.removeEventListener("load", quandoOcioso);
      window.removeEventListener("scroll", comecar);
    };
  }, [semMovimento]);

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 bg-ceu">
      <picture>
        <source
          media="(orientation: portrait)"
          srcSet={caminhoQuadro("mobile", 0)}
        />
        <img
          src={caminhoQuadro("desktop", 0)}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover object-[50%_55%]"
        />
      </picture>
      <canvas
        ref={canvas}
        className="absolute inset-0 size-full opacity-0 transition-opacity duration-300 data-[pronto=1]:opacity-100"
      />
    </div>
  );
}
