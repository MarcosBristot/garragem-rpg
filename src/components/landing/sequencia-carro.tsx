"use client";

import { useEffect, useRef } from "react";
import { useMenosMovimento } from "@/lib/use-menos-movimento";
import {
  caminhoQuadro,
  cobrir,
  misturaDaRolagem,
  ordemDeCarga,
  TOTAL_QUADROS,
} from "./sequencia";

// Fundo da landing: o carro no campo de flores, girando conforme a rolagem.
// São imagens renderizadas no Blender (nenhum modelo 3D vai para o site).
// O 1º quadro vem como <picture> (rápido e funciona sem JavaScript); os
// demais chegam depois e entram num <canvas>. Quem pede menos movimento
// fica só com o 1º quadro.
//
// Fluidez: entre dois quadros, o segundo é desenhado por cima com
// transparência proporcional (a volta fica contínua em vez de "pular"), e
// os quadros baixam do grosso para o fino (a volta inteira cobre cedo).

const PARALELOS = 4; // downloads ao mesmo tempo
const SUAVIDADE = 0.2; // quanto o carro "alcança" a rolagem por quadro de tela

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
    const fila = ordemDeCarga(TOTAL_QUADROS, passo);
    const prontas = new Map<number, HTMLImageElement>();
    let cancelado = false;
    let atual = 0;
    let desenhado = "";
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
          if (cancelado) return;
          prontas.set(i, img);
          desenhado = ""; // um quadro novo pode mudar o que aparece
        })
        .catch(() => undefined)
        .finally(baixarProximo);
    }
    // Os outros quadros começam a baixar logo depois que a página carregou
    // (a abertura fica com uma imagem só) ou na primeira rolagem.
    let comecou = false;
    function comecar() {
      if (comecou || cancelado) return;
      comecou = true;
      for (let k = 0; k < PARALELOS; k++) baixarProximo();
    }
    function quandoOcioso() {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(comecar, { timeout: 500 });
      } else {
        setTimeout(comecar, 200);
      }
    }
    if (document.readyState === "complete") quandoOcioso();
    else window.addEventListener("load", quandoOcioso, { once: true });
    window.addEventListener("scroll", comecar, { once: true, passive: true });

    // Medidas guardadas: ler scrollHeight a cada quadro forçaria o
    // navegador a recalcular o layout (é isso que dá "engasgos").
    let maxRolagem = 1;
    function medir() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      tela!.width = Math.round(window.innerWidth * dpr);
      tela!.height = Math.round(window.innerHeight * dpr);
      maxRolagem = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      desenhado = "";
    }
    medir();
    window.addEventListener("resize", medir);
    const observador = new ResizeObserver(medir);
    observador.observe(document.body);

    function desenhar(img: HTMLImageElement, alfa: number) {
      const r = cobrir(
        img.naturalWidth,
        img.naturalHeight,
        tela!.width,
        tela!.height,
        retrato ? 0.55 : 0.5,
      );
      ctx!.globalAlpha = alfa;
      ctx!.drawImage(img, r.x, r.y, r.l, r.a);
    }

    function quadro() {
      if (cancelado) return;
      const alvo = Math.min(1, Math.max(0, window.scrollY / maxRolagem));
      atual += (alvo - atual) * SUAVIDADE;
      if (Math.abs(alvo - atual) < 0.0002) atual = alvo;

      const m = misturaDaRolagem(atual, TOTAL_QUADROS, (k) => prontas.has(k));
      if (m) {
        // Só redesenha quando muda algo visível (economiza bateria).
        const chave = `${m.a}:${m.b}:${m.mistura.toFixed(3)}`;
        if (chave !== desenhado) {
          desenhar(prontas.get(m.a)!, 1);
          if (m.mistura > 0.002) desenhar(prontas.get(m.b)!, m.mistura);
          ctx!.globalAlpha = 1;
          desenhado = chave;
          tela!.dataset.pronto = "1"; // esconde o <picture> embaixo
        }
      }
      quadroPedido = requestAnimationFrame(quadro);
    }
    quadroPedido = requestAnimationFrame(quadro);

    return () => {
      cancelado = true;
      cancelAnimationFrame(quadroPedido);
      observador.disconnect();
      window.removeEventListener("resize", medir);
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
