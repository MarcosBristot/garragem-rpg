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
  xDianteiroEm,
  xTraseiroEm,
} from "./carroceria";

// Grafite acetinado: escuro como na referência, mas claro o bastante para
// os vidros (mais escuros e espelhados) se destacarem da lataria.
const PINTURA = "#23292d";
const PRETO = "#07090a";
const ALTURA_LANTERNA = 0.8;

/**
 * Halo da lanterna: uma faixa suave ao longo da barra (e não um ponto), que
 * esmaece para cima, para baixo e nas pontas, sem nenhuma borda reta.
 */
function texturaHalo() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  const vertical = g.createLinearGradient(0, 0, 0, 64);
  vertical.addColorStop(0, "rgba(255,40,25,0)");
  vertical.addColorStop(0.5, "rgba(255,50,30,0.55)");
  vertical.addColorStop(1, "rgba(255,40,25,0)");
  g.fillStyle = vertical;
  g.fillRect(0, 0, 256, 64);
  // Recorta as pontas com um degradê horizontal.
  g.globalCompositeOperation = "destination-in";
  const horizontal = g.createLinearGradient(0, 0, 256, 0);
  horizontal.addColorStop(0, "rgba(0,0,0,0)");
  horizontal.addColorStop(0.2, "rgba(0,0,0,1)");
  horizontal.addColorStop(0.8, "rgba(0,0,0,1)");
  horizontal.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = horizontal;
  g.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
}

/** Curva de lado a lado na traseira, na altura y, colada na lataria. */
function curvaTraseira(y: number, meiaLargura: number, folga: number) {
  return new THREE.CatmullRomCurve3(
    Array.from({ length: 17 }, (_, i) => {
      const z = (-1 + (i / 16) * 2) * meiaLargura;
      return new THREE.Vector3(xTraseiroEm(y, z) + folga, y, z);
    }),
  );
}
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
      <mesh position={[0.1, 0.12, 0.03 * lado]} rotation-z={-0.7}>
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
      halo: texturaHalo(),
      molduraLanterna: new THREE.TubeGeometry(
        curvaTraseira(ALTURA_LANTERNA, 0.82, 0.02),
        64,
        0.03,
        8,
        false,
      ),
      farois: [-1, 1].map(
        (lado) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              Array.from({ length: 9 }, (_, i) => {
                const z = lado * (0.28 + (i / 8) * 0.4);
                const y = 0.67 - (i / 8) * 0.04;
                return new THREE.Vector3(xDianteiroEm(y, z) + 0.004, y, z);
              }),
            ),
            32,
            0.011,
            6,
            false,
          ),
      ),
      vidros: [
        superficie(VIDROS.lateral.u, lateralDireita, 0.008, [60, 12]),
        superficie(VIDROS.lateral.u, lateralEsquerda, 0.008, [60, 12]),
        superficie(VIDROS.frente.u, VIDROS.frente.v, 0.008, [24, 30]),
        superficie(VIDROS.tras.u, VIDROS.tras.v, 0.008, [30, 30]),
      ],
      // Barra de luz traseira, de lado a lado, pousada sobre a lataria
      // (xTraseiroEm acha a superfície em cada ponto da curva).
      lanterna: new THREE.TubeGeometry(
        curvaTraseira(ALTURA_LANTERNA, 0.8, -0.008),
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
          metalness={0.75}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {geo.vidros.map((g, i) => (
        <mesh key={i} geometry={g}>
          {/* polygonOffset: o vidro vence a lataria onde se encostam. */}
          <meshPhysicalMaterial
            color="#0a1215"
            metalness={0.9}
            roughness={0.04}
            envMapIntensity={1.2}
            clearcoat={1}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}

      {/* Lanterna em barra: luz vermelha sobre uma moldura preta, mais o
          halo (sem pós-processamento: mais leve no celular). A moldura fica
          mais para dentro: a luz (raio 0,018) sobra 1,6 cm para fora dela. */}
      <mesh geometry={geo.molduraLanterna}>
        <meshStandardMaterial color={PRETO} roughness={0.4} />
      </mesh>
      <mesh geometry={geo.lanterna}>
        <meshBasicMaterial color={LANTERNA} toneMapped={false} />
      </mesh>
      <mesh
        position={[xTraseiroEm(ALTURA_LANTERNA, 0) - 0.05, ALTURA_LANTERNA, 0]}
        rotation-y={-Math.PI / 2}
      >
        <planeGeometry args={[2.1, 0.3]} />
        <meshBasicMaterial
          map={geo.halo}
          transparent
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[-3.1, 0.35, 0]}
        color={LANTERNA}
        intensity={1.4}
        distance={4}
        decay={2}
      />

      {/* Faróis em filete, pousados na frente (recuam nos cantos). */}
      {geo.farois.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#e6f2fa" toneMapped={false} />
        </mesh>
      ))}

      {/* Retrovisores: haste curta e concha arredondada. */}
      {[-1, 1].map((lado) => (
        <group key={lado} position={[0.64, 0.99, lado * 0.84]}>
          <mesh position-z={lado * 0.06}>
            <boxGeometry args={[0.05, 0.03, 0.12]} />
            <meshStandardMaterial color={PRETO} roughness={0.5} />
          </mesh>
          <mesh
            position={[-0.02, 0.03, lado * 0.15]}
            scale={[0.13, 0.065, 0.09]}
          >
            <sphereGeometry args={[1, 20, 12]} />
            <meshPhysicalMaterial
              color={PINTURA}
              metalness={0.75}
              roughness={0.3}
              clearcoat={1}
            />
          </mesh>
        </group>
      ))}

      {/* Difusor com aletas e escapes, encaixados na traseira. */}
      <group position={[xTraseiroEm(0.28, 0) + 0.26, 0.22, 0]}>
        <mesh>
          <boxGeometry args={[0.52, 0.07, 1.25]} />
          <meshStandardMaterial color={PRETO} roughness={0.6} />
        </mesh>
        {[-0.36, -0.12, 0.12, 0.36].map((z) => (
          <mesh key={z} position={[-0.18, 0.05, z]}>
            <boxGeometry args={[0.18, 0.08, 0.015]} />
            <meshStandardMaterial color={PRETO} roughness={0.6} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[xTraseiroEm(0.32, lado * 0.42) + 0.02, 0.32, lado * 0.42]}
          rotation-z={Math.PI / 2}
        >
          <cylinderGeometry args={[0.042, 0.046, 0.12, 24, 1, true]} />
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
