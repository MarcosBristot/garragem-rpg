"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { quandoEncontro } from "@/dominio/encontro";
import {
  CENTRO_BRASIL,
  ESTILO_MAPA,
  URL_WORKER_MAPA,
  ZOOM_BRASIL,
} from "@/lib/mapa";

// Mapa dos encontros (MapLibre + OpenFreeMap). Só roda no navegador.
// Dois modos:
// - "ver": um alfinete por encontro; tocar abre o resumo com link;
// - "escolher": tocar no mapa marca o ponto do encontro (formulário).
// Nunca pede a localização da pessoa (o site proíbe geolocalização).

export type PontoEncontro = {
  id: string;
  titulo: string;
  lat: number;
  lng: number;
  inicio: string;
  local_nome: string;
};

type Props =
  | {
      modo: "ver";
      encontros: PontoEncontro[];
      rotulo: string;
      /** Até onde aproximar ao enquadrar (um encontro só: contexto). */
      zoomMaximo?: number;
    }
  | {
      modo: "escolher";
      ponto: { lat: number; lng: number } | null;
      aoEscolher: (ponto: { lat: number; lng: number }) => void;
      rotulo: string;
    };

function alfinete(): HTMLElement {
  const el = document.createElement("div");
  el.className =
    "size-5 rounded-md border-[3px] border-white bg-destaque shadow-lg shadow-destaque/40 cursor-pointer";
  return el;
}

export function MapaEncontros(props: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  // O callback muda a cada render; o mapa é criado uma vez só.
  const aoEscolher = useRef(
    props.modo === "escolher" ? props.aoEscolher : null,
  );
  const callback = props.modo === "escolher" ? props.aoEscolher : null;
  useEffect(() => {
    aoEscolher.current = callback;
  }, [callback]);
  const encontros = props.modo === "ver" ? props.encontros : null;
  const zoomMaximo = props.modo === "ver" ? (props.zoomMaximo ?? 13) : 13;
  const pontoInicial = props.modo === "escolher" ? props.ponto : null;

  useEffect(() => {
    let cancelado = false;
    let limpar = () => {};
    (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelado || !caixa.current) return;
      maplibre.setWorkerUrl(URL_WORKER_MAPA);
      const semMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const mapa = new maplibre.Map({
        container: caixa.current,
        style: ESTILO_MAPA,
        center: pontoInicial
          ? [pontoInicial.lng, pontoInicial.lat]
          : CENTRO_BRASIL,
        zoom: pontoInicial ? 15 : ZOOM_BRASIL,
        attributionControl: { compact: true },
        // Rolar a página não dá zoom sem querer; dois dedos no celular.
        cooperativeGestures: true,
      });
      mapa.addControl(
        new maplibre.NavigationControl({ showCompass: false }),
        "top-right",
      );
      limpar = () => mapa.remove();

      if (encontros) {
        const limites = new maplibre.LngLatBounds();
        for (const e of encontros) {
          // Conteúdo do balão montado com textContent: nada de HTML vindo
          // do banco (título e lugar são digitados por pessoas).
          const balao = document.createElement("div");
          balao.className = "flex flex-col gap-1 text-sm text-texto";
          const titulo = document.createElement("a");
          titulo.href = `/mapa/${e.id}`;
          titulo.className = "font-semibold text-destaque underline";
          titulo.textContent = e.titulo;
          const quando = document.createElement("span");
          quando.textContent = quandoEncontro(e.inicio);
          const onde = document.createElement("span");
          onde.className = "text-texto-secundario";
          onde.textContent = e.local_nome;
          balao.append(titulo, quando, onde);
          new maplibre.Marker({ element: alfinete() })
            .setLngLat([e.lng, e.lat])
            .setPopup(new maplibre.Popup({ offset: 14 }).setDOMContent(balao))
            .addTo(mapa);
          limites.extend([e.lng, e.lat]);
        }
        if (encontros.length > 0) {
          mapa.fitBounds(limites, {
            padding: 60,
            maxZoom: zoomMaximo,
            duration: semMovimento ? 0 : 800,
          });
        }
      } else {
        let marcador: InstanceType<typeof maplibre.Marker> | null = null;
        const marcar = (lng: number, lat: number) => {
          if (!marcador) {
            marcador = new maplibre.Marker({
              element: alfinete(),
              draggable: true,
            })
              .setLngLat([lng, lat])
              .addTo(mapa);
            marcador.on("dragend", () => {
              const p = marcador!.getLngLat();
              aoEscolher.current?.({ lat: p.lat, lng: p.lng });
            });
          } else {
            marcador.setLngLat([lng, lat]);
          }
          aoEscolher.current?.({ lat, lng });
        };
        if (pontoInicial) marcar(pontoInicial.lng, pontoInicial.lat);
        mapa.on("click", (ev) => marcar(ev.lngLat.lng, ev.lngLat.lat));
      }
    })();
    return () => {
      cancelado = true;
      limpar();
    };
    // Criado uma vez; os dados chegam prontos do servidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={caixa}
      role="region"
      aria-label={props.rotulo}
      className="h-full w-full bg-superficie-2"
    />
  );
}
