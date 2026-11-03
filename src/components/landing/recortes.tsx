"use client";

// Recortes renderizados (cavalo e olmo) postos na cena como "cartões" que
// giram para encarar a câmera e somem na névoa. São IMAGENS renderizadas a
// partir de modelos com licença Royalty Free (CGTrader): o arquivo 3D nunca
// vai para o site, como a licença exige. Origem e licença em docs/creditos.md.

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Vec3 = [number, number, number];

const IMAGENS = [
  "/landing/cavalo.webp",
  "/landing/arvore.webp",
  "/landing/arvore-b.webp",
];
// Baixa as imagens assim que este código chega ao navegador, em paralelo
// com a montagem da cena (que leva uns segundos): sem isso, o download só
// começava depois, e o cavalo e as árvores "atrasavam".
useTexture.preload(IMAGENS);

/**
 * Cartão em pé, com a base no chão, girando só no eixo vertical para
 * encarar a câmera (não "deita" quando a câmera sobe).
 */
function Cartao({
  textura,
  altura,
  posicao,
  espelhar = false,
  semMovimento,
}: {
  textura: THREE.Texture;
  altura: number;
  posicao: Vec3;
  espelhar?: boolean;
  semMovimento: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const imagem = textura.image as { width: number; height: number };
  const largura = altura * (imagem.width / imagem.height);
  useFrame(({ camera }, dt) => {
    const g = ref.current;
    if (!g) return;
    // Surge esmaecendo (~0,8 s) em vez de "pipocar" quando a imagem chega.
    const m = material.current;
    if (m && m.opacity < 1)
      m.opacity = semMovimento ? 1 : Math.min(1, m.opacity + dt * 1.25);
    g.rotation.y = Math.atan2(
      camera.position.x - g.position.x,
      camera.position.z - g.position.z,
    );
  });
  return (
    <group ref={ref} position={posicao}>
      <mesh position-y={altura / 2} scale-x={espelhar ? -1 : 1}>
        <planeGeometry args={[largura, altura]} />
        <meshBasicMaterial
          ref={material}
          map={textura}
          transparent
          opacity={0}
          alphaTest={0.05}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Sombra suave no chão (o cartão sozinho parece flutuar). */
function Sombra({
  posicao,
  tamanho,
}: {
  posicao: Vec3;
  tamanho: [number, number];
}) {
  const textura = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(0,0,0,0.7)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh position={[posicao[0], 0.012, posicao[2]]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={tamanho} />
      <meshBasicMaterial map={textura} transparent depthWrite={false} />
    </mesh>
  );
}

function srgb(...texturas: THREE.Texture[]) {
  for (const t of texturas) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
  }
}

/** Gerador pseudoaleatório com semente fixa (cena sempre igual). */
function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Recortes({
  cavalo,
  semMovimento,
}: {
  cavalo: Vec3;
  semMovimento: boolean;
}) {
  const [texCavalo, texArvore, texArvoreB] = useTexture(IMAGENS);
  srgb(texCavalo, texArvore, texArvoreB);

  // Linha de árvores ao fundo: atrás da cerca, quase toda na névoa.
  const fundo = useMemo(() => {
    const r = aleatorio(23);
    return Array.from({ length: 22 }, (_, i) => {
      const ang = Math.PI * (1.08 + r() * 0.84);
      const dist = 24 + r() * 12;
      return {
        posicao: [Math.cos(ang) * dist, 0, Math.sin(ang) * dist] as Vec3,
        altura: 9 + r() * 6,
        b: i % 2 === 1,
        espelhar: r() > 0.5,
      };
    });
  }, []);

  return (
    <>
      {/* Cavalo: ~2,35 m das orelhas aos cascos (cabeça erguida). */}
      <Cartao
        textura={texCavalo}
        altura={2.35}
        posicao={cavalo}
        semMovimento={semMovimento}
      />
      <Sombra posicao={cavalo} tamanho={[2.6, 0.9]} />

      {/* Olmo grande à direita, como na referência de clima. */}
      <Cartao
        textura={texArvore}
        altura={13}
        posicao={[7.4, 0, -1.2]}
        semMovimento={semMovimento}
      />

      {fundo.map((a, i) => (
        <Cartao
          key={i}
          textura={a.b ? texArvoreB : texArvore}
          altura={a.altura}
          posicao={a.posicao}
          espelhar={a.espelhar}
          semMovimento={semMovimento}
        />
      ))}
    </>
  );
}
