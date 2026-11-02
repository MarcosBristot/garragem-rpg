"use client";

// Cavalo em silhueta 3D, montado com formas simples (design próprio, sem
// modelo de terceiros). Escuro: na névoa, como na referência de clima, o
// que conta é o contorno. Mexe a cauda e a cabeça de leve, a não ser para
// quem pede menos movimento. Frente em +X, medidas em metros (~1,6 m na cernelha).

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COR = "#0b1011";

function Parte({
  args,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  tipo = "esfera",
}: {
  args: number[];
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  tipo?: "esfera" | "cilindro" | "cone";
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      {tipo === "esfera" ? (
        <sphereGeometry args={args as [number, number, number]} />
      ) : tipo === "cone" ? (
        <coneGeometry args={args as [number, number, number]} />
      ) : (
        <cylinderGeometry args={args as [number, number, number, number]} />
      )}
      <meshStandardMaterial color={COR} roughness={0.75} />
    </mesh>
  );
}

/** Perna: coxa/antebraço afinando, canela fina, casco. */
function Perna({
  x,
  z,
  traseira,
}: {
  x: number;
  z: number;
  traseira: boolean;
}) {
  const inclinacao = traseira ? 0.12 : -0.04;
  return (
    <group position={[x, 1.02, z]} rotation-z={inclinacao}>
      <Parte
        tipo="cilindro"
        args={[0.1, 0.075, 0.5, 12]}
        position={[0, -0.25, 0]}
      />
      <Parte tipo="esfera" args={[0.07, 12, 8]} position={[0, -0.52, 0]} />
      <Parte
        tipo="cilindro"
        args={[0.045, 0.04, 0.44, 10]}
        position={[traseira ? 0.03 : 0, -0.76, 0]}
      />
      <Parte
        tipo="cilindro"
        args={[0.055, 0.07, 0.08, 12]}
        position={[traseira ? 0.05 : 0.01, -0.99, 0]}
      />
    </group>
  );
}

export function Cavalo3D({ semMovimento }: { semMovimento: boolean }) {
  const cabeca = useRef<THREE.Group>(null);
  const cauda = useRef<THREE.Group>(null);

  const geoCauda = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-0.12, -0.25, 0),
          new THREE.Vector3(-0.14, -0.6, 0),
          new THREE.Vector3(-0.08, -0.95, 0),
        ]),
        24,
        0.05,
        8,
        false,
      ),
    [],
  );

  useFrame(({ clock }) => {
    if (semMovimento) return;
    const t = clock.elapsedTime;
    if (cauda.current) cauda.current.rotation.x = Math.sin(t * 1.3) * 0.18;
    if (cabeca.current)
      cabeca.current.rotation.z = -0.15 + Math.sin(t * 0.45) * 0.06;
  });

  return (
    <group>
      {/* Tronco: peito, barriga e anca. */}
      <Parte
        args={[0.5, 24, 16]}
        position={[0, 1.32, 0]}
        scale={[1.55, 0.72, 0.62]}
      />
      <Parte
        args={[0.36, 20, 14]}
        position={[0.55, 1.36, 0]}
        scale={[1, 1.05, 0.95]}
      />
      <Parte
        args={[0.38, 20, 14]}
        position={[-0.6, 1.38, 0]}
        scale={[1, 1, 0.98]}
      />

      {/* Pescoço e cabeça (giram juntos, a partir da cernelha). */}
      <group ref={cabeca} position={[0.62, 1.55, 0]} rotation-z={-0.15}>
        <Parte
          tipo="cilindro"
          args={[0.13, 0.25, 0.85, 14]}
          position={[0.22, 0.32, 0]}
          rotation={[0, 0, -0.72]}
        />
        {/* Crina: faixa por cima do pescoço. */}
        <mesh position={[0.12, 0.45, 0]} rotation-z={-0.72}>
          <boxGeometry args={[0.07, 0.8, 0.05]} />
          <meshStandardMaterial color="#070a0b" roughness={1} />
        </mesh>
        <group position={[0.52, 0.66, 0]} rotation-z={-1.75}>
          <Parte
            args={[0.14, 16, 12]}
            position={[0, 0, 0]}
            scale={[1, 1.1, 0.85]}
          />
          <Parte
            tipo="cilindro"
            args={[0.07, 0.11, 0.42, 12]}
            position={[0, 0.24, 0]}
          />
          <Parte
            args={[0.08, 12, 10]}
            position={[0, 0.45, 0]}
            scale={[1, 0.8, 1]}
          />
          {[-1, 1].map((lado) => (
            <Parte
              key={lado}
              tipo="cone"
              args={[0.035, 0.13, 8]}
              position={[-0.13, -0.05, lado * 0.06]}
              rotation={[0, 0, 1.75]}
            />
          ))}
        </group>
      </group>

      {/* Cauda. */}
      <group ref={cauda} position={[-0.92, 1.48, 0]}>
        <mesh geometry={geoCauda}>
          <meshStandardMaterial color="#070a0b" roughness={1} />
        </mesh>
      </group>

      <Perna x={0.5} z={0.15} traseira={false} />
      <Perna x={0.58} z={-0.15} traseira={false} />
      <Perna x={-0.62} z={0.16} traseira />
      <Perna x={-0.52} z={-0.16} traseira />
    </group>
  );
}
