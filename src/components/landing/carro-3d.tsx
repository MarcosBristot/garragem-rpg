"use client";

// Esportivo genérico modelado em código para o projeto: sem marca e sem
// copiar um modelo real (regra de propriedade intelectual). Medidas em
// metros, frente apontando para +X. Para trocar por um .glb licenciado
// depois, basta substituir este componente.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const LARGURA = 1.7;
const BISEL = 0.1;
const RODA_RAIO = 0.36;
const EIXO_TRASEIRO = -1.35;
const EIXO_DIANTEIRO = 1.4;

/** Perfil lateral da carroceria, com as caixas de roda recortadas. */
function perfilCarroceria() {
  const s = new THREE.Shape();
  const arco = 0.42;
  s.moveTo(-2.15, 0.34);
  s.lineTo(EIXO_TRASEIRO - arco, 0.34);
  s.absarc(EIXO_TRASEIRO, 0.34, arco, Math.PI, 0, true);
  s.lineTo(EIXO_DIANTEIRO - arco, 0.34);
  s.absarc(EIXO_DIANTEIRO, 0.34, arco, Math.PI, 0, true);
  s.lineTo(2.2, 0.34);
  s.quadraticCurveTo(2.34, 0.42, 2.3, 0.62); // para-choque
  s.quadraticCurveTo(2.2, 0.76, 1.6, 0.82); // capô
  s.lineTo(0.75, 0.9);
  s.bezierCurveTo(0.35, 1.16, -0.3, 1.22, -0.78, 1.12); // para-brisa e teto
  s.quadraticCurveTo(-1.6, 0.98, -2.05, 0.82); // traseira fastback
  s.quadraticCurveTo(-2.25, 0.76, -2.2, 0.56);
  s.lineTo(-2.15, 0.34);
  return s;
}

/** Faixa de vidro: janelas laterais e teto panorâmico. */
function perfilVidros() {
  const s = new THREE.Shape();
  s.moveTo(0.7, 0.9);
  s.bezierCurveTo(0.33, 1.15, -0.3, 1.21, -0.76, 1.12);
  s.quadraticCurveTo(-1.42, 1.0, -1.78, 0.88);
  s.lineTo(0.7, 0.88);
  return s;
}

/**
 * Afina a extrusão para parecer carro, não caixa: estreita para cima
 * (a "cintura" do teto) e nas pontas (bico e traseira).
 */
function afinar(original: THREE.BufferGeometry) {
  // 1) Subdivide: as laterais da extrusão viriam em triângulos enormes, que
  //    ficam tortos (facetados) ao deformar. 2) Junta vértices repetidos
  //    para as normais saírem suaves.
  const subdividida = new TessellateModifier(0.12, 8).modify(original);
  subdividida.deleteAttribute("uv");
  subdividida.deleteAttribute("normal");
  const geo = mergeVertices(subdividida, 1e-3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    let fator = 1;
    // Teto mais estreito, com transição suave (sem vinco na lataria).
    const t = Math.min(1, Math.max(0, (y - 0.6) / 0.62));
    fator -= 0.3 * t * t;
    const ponta = Math.max(0, Math.abs(x) - 1.55);
    fator -= ponta * ponta * 0.35; // bico e traseira arredondados
    pos.setZ(i, pos.getZ(i) * fator);
  }
  geo.computeVertexNormals();
  return geo;
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
  return (
    <group position={[x, RODA_RAIO, z]}>
      <group ref={ref}>
        {/* Pneu: eixo do cilindro virado para a largura do carro (Z). */}
        <mesh rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[RODA_RAIO, RODA_RAIO, 0.26, 40]} />
          <meshStandardMaterial color="#111114" roughness={0.9} />
        </mesh>
        {/* Aro */}
        <mesh rotation-x={Math.PI / 2} position-z={0.012 * lado}>
          <cylinderGeometry args={[0.25, 0.25, 0.25, 40]} />
          <meshStandardMaterial
            color="#9aa0aa"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
        {/* Raios */}
        {Array.from({ length: 5 }, (_, i) => (
          <mesh
            key={i}
            rotation-z={(i * Math.PI * 2) / 5}
            position-z={0.135 * lado}
          >
            <boxGeometry args={[0.04, 0.46, 0.02]} />
            <meshStandardMaterial
              color="#d6dae0"
              metalness={1}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Carro3D({ giroRodasRef }: { giroRodasRef: RefObject<number> }) {
  const [carroceria, vidros] = useMemo(() => {
    const opcoes = {
      bevelEnabled: true,
      bevelThickness: BISEL,
      bevelSize: 0.08,
      bevelSegments: 6,
      curveSegments: 48,
    };
    const c = new THREE.ExtrudeGeometry(perfilCarroceria(), {
      ...opcoes,
      depth: LARGURA,
    });
    c.translate(0, 0, -LARGURA / 2);
    // Vidro um pouco mais largo e alto que a lataria: aflora na superfície.
    const v = new THREE.ExtrudeGeometry(perfilVidros(), {
      ...opcoes,
      depth: LARGURA + 0.03,
      bevelSize: 0.08,
      bevelThickness: BISEL + 0.01,
    });
    v.translate(0, 0.02, -(LARGURA + 0.03) / 2);
    return [afinar(c), afinar(v)];
  }, []);

  const metadeZ = LARGURA / 2 + BISEL - 0.12;

  return (
    <group>
      <mesh geometry={carroceria} castShadow>
        {/* Pintura metálica com verniz (clearcoat), em âmbar da marca. */}
        <meshPhysicalMaterial
          color="#d9821a"
          metalness={0.55}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.06}
        />
      </mesh>
      <mesh geometry={vidros}>
        {/* polygonOffset: onde vidro e lataria se encostam, o vidro vence
            (evita o "chuvisco" de z-fighting na linha da cintura). */}
        <meshPhysicalMaterial
          color="#050506"
          metalness={0.2}
          roughness={0.05}
          clearcoat={1}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* Faróis em "L" e barra de luz traseira (emissivos). */}
      {[-1, 1].map((lado) => (
        <mesh
          key={lado}
          position={[2.27, 0.64, lado * 0.62]}
          rotation-y={0.25 * lado}
        >
          <boxGeometry args={[0.06, 0.05, 0.38]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={3}
          />
        </mesh>
      ))}
      <mesh position={[-2.24, 0.7, 0]}>
        <boxGeometry args={[0.04, 0.05, LARGURA + 0.05]} />
        <meshStandardMaterial
          color="#ff2a2a"
          emissive="#ff2a2a"
          emissiveIntensity={2.5}
        />
      </mesh>

      {[EIXO_TRASEIRO, EIXO_DIANTEIRO].flatMap((x) =>
        [-metadeZ, metadeZ].map((z) => (
          <Roda key={`${x}${z}`} x={x} z={z} giroRef={giroRodasRef} />
        )),
      )}
    </group>
  );
}
