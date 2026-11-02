"use client";

// Esportivo genérico modelado em código para o projeto: sem marca e sem
// copiar um carro real (regra de propriedade intelectual). A forma vem de
// carroceria.ts (seções ao longo do comprimento, testada); aqui ficam os
// materiais e os detalhes: vidros, lanterna em barra, faróis, retrovisores,
// difusor, escapes e rodas com freio. Frente em +X, medidas em metros.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { ParametricGeometry } from "three/examples/jsm/geometries/ParametricGeometry.js";
import { PALETA } from "@/lib/paleta";
import {
  ARCO_RAIO,
  EIXO_DIANTEIRO,
  EIXO_TRASEIRO,
  pontoCarroceria,
  RODA_RAIO,
  secaoEm,
  VIDROS,
} from "./carroceria";

const PINTURA = "#15191c"; // grafite fosco-acetinado, como na referência
const PRETO = "#07090a";
const LANTERNA = "#ff2b1f";

/** Superfície (ou um pedaço dela) a partir de carroceria.ts. */
function superficie(
  [u0, u1]: readonly [number, number],
  [v0, v1]: readonly [number, number],
  afastar = 0,
  segmentos: [number, number] = [160, 96],
) {
  return new ParametricGeometry(
    (a, b, alvo) => {
      const u = u0 + a * (u1 - u0);
      const v = v0 + b * (v1 - v0);
      const [x, y, z] = pontoCarroceria(u, v);
      if (afastar === 0) return alvo.set(x, y, z);
      // Vidro: um fio para fora da lataria, a partir do centro da seção.
      const s = secaoEm(u);
      const centro = (s.topo + s.base) / 2;
      return alvo.set(
        x,
        centro + (y - centro) * (1 + afastar),
        z * (1 + afastar),
      );
    },
    ...segmentos,
  );
}

function Roda({
  x,
  z,
  giroRef,
}: {
  x: number;
  z: number;
  giroRef: RefObject<number>;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = -giroRef.current;
  });
  const lado = z > 0 ? 1 : -1;

  // Pneu com ombro arredondado: perfil girado (lathe) em volta do eixo.
  const pneu = useMemo(() => {
    const perfil: THREE.Vector2[] = [];
    const largura = 0.27;
    for (let i = 0; i <= 16; i++) {
      const t = (i / 16) * Math.PI;
      perfil.push(
        new THREE.Vector2(
          RODA_RAIO - 0.07 + Math.sin(t) * 0.07,
          -largura / 2 + (1 - Math.cos(t)) * (largura / 2),
        ),
      );
    }
    return new THREE.LatheGeometry(perfil, 64);
  }, []);

  return (
    <group position={[x, RODA_RAIO, z]}>
      {/* Disco e pinça de freio ficam parados; o resto gira. */}
      <mesh rotation-x={Math.PI / 2} position-z={-0.03 * lado}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 40]} />
        <meshStandardMaterial
          color="#5b6164"
          metalness={0.8}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[0.1, 0.12, 0.0 * lado]} rotation-z={-0.7}>
        <boxGeometry args={[0.07, 0.15, 0.09]} />
        <meshStandardMaterial color={PALETA.destaque} roughness={0.5} />
      </mesh>
      <group ref={ref}>
        <mesh geometry={pneu} rotation-x={Math.PI / 2}>
          <meshStandardMaterial color="#0c0d0e" roughness={0.92} />
        </mesh>
        {/* Aro: borda + 10 raios em pares + cubo. */}
        <mesh rotation-x={Math.PI / 2} position-z={0.09 * lado}>
          <torusGeometry args={[0.245, 0.018, 12, 64]} />
          <meshStandardMaterial
            color="#2b2f33"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh
            key={i}
            rotation-z={
              (Math.floor(i / 2) * Math.PI * 2) / 5 + (i % 2 ? 0.13 : -0.13)
            }
            position-z={0.1 * lado}
          >
            <boxGeometry args={[0.022, 0.46, 0.03]} />
            <meshStandardMaterial
              color="#30353a"
              metalness={0.9}
              roughness={0.28}
            />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2} position-z={0.1 * lado}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 24]} />
          <meshStandardMaterial
            color="#1a1d20"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
      </group>
    </group>
  );
}

export function Carro3D({ giroRodasRef }: { giroRodasRef: RefObject<number> }) {
  const geo = useMemo(() => {
    const lateralDireita = VIDROS.lateral.v;
    const lateralEsquerda = [
      1 - lateralDireita[1],
      1 - lateralDireita[0],
    ] as const;
    return {
      carroceria: superficie([0, 1], [0, 1]),
      vidros: [
        superficie(VIDROS.lateral.u, lateralDireita, 0.008, [60, 12]),
        superficie(VIDROS.lateral.u, lateralEsquerda, 0.008, [60, 12]),
        superficie(VIDROS.frente.u, VIDROS.frente.v, 0.008, [24, 30]),
        superficie(VIDROS.tras.u, VIDROS.tras.v, 0.008, [30, 30]),
      ],
      // Barra de luz traseira, de lado a lado, acompanhando a curva.
      lanterna: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          Array.from({ length: 9 }, (_, i) => {
            const t = -1 + (i / 8) * 2;
            return new THREE.Vector3(-2.2 + 0.06 * t * t, 0.78, t * 0.79);
          }),
        ),
        64,
        0.018,
        8,
        false,
      ),
    };
  }, []);

  return (
    <group>
      <mesh geometry={geo.carroceria}>
        {/* Pintura com verniz (clearcoat): reflete o céu enevoado. */}
        <meshPhysicalMaterial
          color={PINTURA}
          metalness={0.6}
          roughness={0.34}
          clearcoat={1}
          clearcoatRoughness={0.07}
          side={THREE.DoubleSide}
        />
      </mesh>
      {geo.vidros.map((g, i) => (
        <mesh key={i} geometry={g}>
          {/* polygonOffset: o vidro vence a lataria onde se encostam. */}
          <meshPhysicalMaterial
            color="#050708"
            metalness={0.3}
            roughness={0.04}
            clearcoat={1}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}

      {/* Lanterna em barra + brilho (sem pós-processamento: mais leve). */}
      <mesh geometry={geo.lanterna}>
        <meshBasicMaterial color={LANTERNA} toneMapped={false} />
      </mesh>
      <pointLight
        position={[-2.6, 0.75, 0]}
        color={LANTERNA}
        intensity={3}
        distance={5}
        decay={2}
      />

      {/* Faróis finos. */}
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[2.12, 0.66, lado * 0.62]}
          rotation-y={0.35 * lado}
        >
          <boxGeometry args={[0.03, 0.025, 0.36]} />
          <meshBasicMaterial color="#e8f4ff" toneMapped={false} />
        </mesh>
      ))}

      {/* Retrovisores. */}
      {[-1, 1].map((lado) => (
        <group key={lado} position={[0.62, 1.0, lado * 0.92]}>
          <mesh position-z={lado * 0.06}>
            <boxGeometry args={[0.16, 0.08, 0.12]} />
            <meshPhysicalMaterial
              color={PINTURA}
              metalness={0.6}
              roughness={0.34}
              clearcoat={1}
            />
          </mesh>
        </group>
      ))}

      {/* Difusor, saias e escapes (preto). */}
      <mesh position={[-2.0, 0.27, 0]}>
        <boxGeometry args={[0.4, 0.12, 1.5]} />
        <meshStandardMaterial color={PRETO} roughness={0.7} />
      </mesh>
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[-2.2, 0.3, lado * 0.42]}
          rotation-z={Math.PI / 2}
        >
          <cylinderGeometry args={[0.045, 0.05, 0.12, 24, 1, true]} />
          <meshStandardMaterial
            color="#8d949a"
            metalness={1}
            roughness={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Caixas de roda escuras: escondem o interior dos arcos. */}
      {[EIXO_TRASEIRO, EIXO_DIANTEIRO].flatMap((x) =>
        [-1, 1].map((lado) => (
          <mesh
            key={`${x}${lado}`}
            position={[x, RODA_RAIO, lado * 0.66]}
            rotation-x={Math.PI / 2}
          >
            <cylinderGeometry
              args={[
                ARCO_RAIO - 0.01,
                ARCO_RAIO - 0.01,
                0.42,
                32,
                1,
                true,
                Math.PI / 2,
                Math.PI,
              ]}
            />
            <meshStandardMaterial
              color={PRETO}
              roughness={1}
              side={THREE.DoubleSide}
            />
          </mesh>
        )),
      )}

      {[EIXO_TRASEIRO, EIXO_DIANTEIRO].flatMap((x) =>
        [-0.8, 0.8].map((z) => (
          <Roda key={`${x}${z}`} x={x} z={z} giroRef={giroRodasRef} />
        )),
      )}
    </group>
  );
}
