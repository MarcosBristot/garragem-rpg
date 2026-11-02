"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { coresDoPersonagem, type Personagem } from "@/dominio/personagem";

// Boneco de blocos montado só com caixas (sem modelo baixado, design
// próprio). Medidas em metros "de brinquedo": chão em y = 0, ~2,4 de altura.

type Vec3 = [number, number, number];
const ESCURO = "#15161A";
const SAPATO = "#1A1B1F";
const GRAFITE = "#2B2D33";

function Bloco({
  t,
  p,
  cor,
  metal = 0,
}: {
  t: Vec3;
  p: Vec3;
  cor: string;
  metal?: number;
}) {
  return (
    <mesh position={p}>
      <boxGeometry args={t} />
      <meshStandardMaterial
        color={cor}
        roughness={metal ? 0.3 : 0.85}
        metalness={metal}
      />
    </mesh>
  );
}

function Cabelo({
  estilo,
  cor,
}: {
  estilo: Personagem["cabelo"];
  cor: string;
}) {
  // Topo + franja: sem a franja, de frente o boneco parecia careca.
  const topo = (
    <>
      <Bloco t={[0.78, 0.14, 0.78]} p={[0, 2.3, 0]} cor={cor} />
      <Bloco t={[0.78, 0.12, 0.04]} p={[0, 2.25, 0.38]} cor={cor} />
    </>
  );
  const nuca = <Bloco t={[0.78, 0.4, 0.1]} p={[0, 2.12, -0.35]} cor={cor} />;
  const lados = (
    <>
      <Bloco t={[0.05, 0.22, 0.6]} p={[-0.385, 2.18, -0.05]} cor={cor} />
      <Bloco t={[0.05, 0.22, 0.6]} p={[0.385, 2.18, -0.05]} cor={cor} />
    </>
  );
  switch (estilo) {
    case "raspado":
      return <Bloco t={[0.76, 0.05, 0.76]} p={[0, 2.345, 0]} cor={cor} />;
    case "curto":
      return (
        <>
          {topo}
          {nuca}
          {lados}
        </>
      );
    case "topete":
      return (
        <>
          {topo}
          {nuca}
          {lados}
          <Bloco t={[0.5, 0.16, 0.26]} p={[0, 2.43, 0.22]} cor={cor} />
        </>
      );
    case "longo":
      return (
        <>
          {topo}
          <Bloco t={[0.8, 0.9, 0.12]} p={[0, 1.9, -0.37]} cor={cor} />
          <Bloco t={[0.07, 0.6, 0.7]} p={[-0.39, 2.0, -0.03]} cor={cor} />
          <Bloco t={[0.07, 0.6, 0.7]} p={[0.39, 2.0, -0.03]} cor={cor} />
        </>
      );
    case "coque":
      return (
        <>
          {topo}
          {nuca}
          <Bloco t={[0.3, 0.3, 0.3]} p={[0, 2.47, -0.2]} cor={cor} />
        </>
      );
  }
}

function Acessorio({
  tipo,
  cor,
}: {
  tipo: Personagem["acessorio"];
  cor: string;
}) {
  switch (tipo) {
    case "nenhum":
      return null;
    case "bone":
      return (
        <>
          <Bloco t={[0.8, 0.2, 0.8]} p={[0, 2.36, 0]} cor={cor} />
          <Bloco t={[0.62, 0.05, 0.32]} p={[0, 2.28, 0.52]} cor={cor} />
        </>
      );
    case "capacete":
      return (
        <>
          <Bloco t={[0.9, 0.86, 0.88]} p={[0, 1.99, -0.02]} cor={cor} />
          <Bloco
            t={[0.72, 0.28, 0.02]}
            p={[0, 2.0, 0.43]}
            cor={ESCURO}
            metal={0.6}
          />
        </>
      );
    case "oculos":
      return (
        <>
          <Bloco
            t={[0.66, 0.14, 0.03]}
            p={[0, 1.98, 0.385]}
            cor={ESCURO}
            metal={0.5}
          />
          <Bloco t={[0.03, 0.05, 0.42]} p={[-0.38, 1.99, 0.18]} cor={ESCURO} />
          <Bloco t={[0.03, 0.05, 0.42]} p={[0.38, 1.99, 0.18]} cor={ESCURO} />
        </>
      );
    case "fone":
      return (
        <>
          <Bloco t={[0.86, 0.07, 0.12]} p={[0, 2.37, 0]} cor={GRAFITE} />
          <Bloco t={[0.07, 0.4, 0.12]} p={[-0.42, 2.17, 0]} cor={GRAFITE} />
          <Bloco t={[0.07, 0.4, 0.12]} p={[0.42, 2.17, 0]} cor={GRAFITE} />
          <Bloco t={[0.1, 0.24, 0.24]} p={[-0.43, 1.96, 0]} cor={cor} />
          <Bloco t={[0.1, 0.24, 0.24]} p={[0.43, 1.96, 0]} cor={cor} />
        </>
      );
  }
}

function Braco({
  lado,
  personagem,
  cores,
  semMovimento,
}: {
  lado: 1 | -1;
  personagem: Personagem;
  cores: ReturnType<typeof coresDoPersonagem>;
  semMovimento: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (semMovimento || !grupo.current) return;
    grupo.current.rotation.x = Math.sin(clock.elapsedTime * 2) * 0.08 * lado;
  });
  const mangaCurta = personagem.roupa === "camiseta";
  return (
    // Gira a partir do ombro.
    <group ref={grupo} position={[0.53 * lado, 1.56, 0]}>
      {mangaCurta ? (
        <>
          <Bloco t={[0.28, 0.3, 0.32]} p={[0, -0.15, 0]} cor={cores.roupa} />
          <Bloco t={[0.26, 0.52, 0.3]} p={[0, -0.56, 0]} cor={cores.pele} />
        </>
      ) : (
        <>
          <Bloco t={[0.27, 0.68, 0.31]} p={[0, -0.34, 0]} cor={cores.roupa} />
          <Bloco t={[0.26, 0.14, 0.3]} p={[0, -0.75, 0]} cor={cores.pele} />
        </>
      )}
    </group>
  );
}

function Boneco({
  personagem,
  semMovimento,
}: {
  personagem: Personagem;
  semMovimento: boolean;
}) {
  const corpo = useRef<THREE.Group>(null);
  const cores = coresDoPersonagem(personagem);
  useFrame(({ clock }) => {
    if (semMovimento || !corpo.current) return;
    corpo.current.position.y = Math.abs(Math.sin(clock.elapsedTime * 2)) * 0.03;
  });
  const roupa = personagem.roupa;

  return (
    <group ref={corpo}>
      {/* Pernas e sapatos */}
      {([-1, 1] as const).map((lado) => (
        <group key={lado}>
          <Bloco
            t={[0.34, 0.62, 0.38]}
            p={[0.19 * lado, 0.41, 0]}
            cor={cores.calca}
          />
          <Bloco
            t={[0.36, 0.14, 0.44]}
            p={[0.19 * lado, 0.07, 0.03]}
            cor={SAPATO}
          />
        </group>
      ))}

      {/* Tronco e detalhes da roupa */}
      <Bloco t={[0.8, 0.86, 0.44]} p={[0, 1.15, 0]} cor={cores.roupa} />
      {roupa === "jaqueta" ? (
        <>
          <Bloco
            t={[0.04, 0.8, 0.02]}
            p={[0, 1.15, 0.225]}
            cor={GRAFITE}
            metal={0.4}
          />
          <Bloco t={[0.84, 0.1, 0.48]} p={[0, 1.55, 0]} cor={cores.roupa} />
        </>
      ) : null}
      {roupa === "macacao" ? (
        <>
          <Bloco t={[0.26, 0.2, 0.02]} p={[0.18, 1.3, 0.225]} cor={GRAFITE} />
          <Bloco t={[0.82, 0.08, 0.46]} p={[0, 0.78, 0]} cor={GRAFITE} />
        </>
      ) : null}

      <Braco
        lado={-1}
        personagem={personagem}
        cores={cores}
        semMovimento={semMovimento}
      />
      <Braco
        lado={1}
        personagem={personagem}
        cores={cores}
        semMovimento={semMovimento}
      />

      {/* Cabeça e rosto */}
      <Bloco t={[0.74, 0.74, 0.74]} p={[0, 1.95, 0]} cor={cores.pele} />
      <Bloco t={[0.1, 0.13, 0.02]} p={[-0.15, 1.99, 0.375]} cor={ESCURO} />
      <Bloco t={[0.1, 0.13, 0.02]} p={[0.15, 1.99, 0.375]} cor={ESCURO} />
      <Bloco t={[0.2, 0.04, 0.02]} p={[0, 1.78, 0.375]} cor="#5A2E22" />

      {personagem.acessorio === "capacete" ? null : (
        <Cabelo estilo={personagem.cabelo} cor={cores.cabelo} />
      )}
      <Acessorio tipo={personagem.acessorio} cor={cores.roupa} />
    </group>
  );
}

export default function CenaBoneco({
  personagem,
  semMovimento,
  aoCarregar,
}: {
  personagem: Personagem;
  semMovimento: boolean;
  aoCarregar: () => void;
}) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [1.7, 2.1, 5.0], fov: 34 }}
      dpr={[1, 1.75]}
      frameloop={semMovimento ? "demand" : "always"}
      fallback={null}
      onCreated={aoCarregar}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight
        position={[-4, 2, -3]}
        intensity={0.6}
        color="#F5A524"
      />
      <Boneco personagem={personagem} semMovimento={semMovimento} />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={4}
        blur={2.4}
        far={2}
      />
      <OrbitControls
        target={[0, 1.25, 0]}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!semMovimento}
        autoRotateSpeed={1.2}
      />
    </Canvas>
  );
}
