"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SilhuetaCarro } from "@/components/silhueta-carro";
import { Carro3D } from "./carro-3d";
import { Cavalo3D } from "./cavalo-3d";
import { Cenario, COR_NEVOA } from "./cenario";
import { quadroEm, type Quadro } from "./trajetoria";

// Posições da câmera ao longo da rolagem (0 = topo, 1 = fim da página).
// Cada seção da landing corresponde a um trecho.
const QUADROS: Quadro[] = [
  { p: 0.0, pos: [6.4, 1.4, 5.2], alvo: [0, 1.75, 0] }, // 3/4 dianteira, carro embaixo
  { p: 0.17, pos: [5.6, 0.8, 1.2], alvo: [0, 0.7, 0] }, // quase de frente, baixo
  { p: 0.34, pos: [0.2, 1.2, 6.6], alvo: [0, 0.7, 0] }, // lateral (dados)
  { p: 0.51, pos: [-4.6, 2.2, 4.2], alvo: [0, 0.8, 0] }, // 3/4 traseira (ficha)
  { p: 0.68, pos: [-1.2, 6.4, 2.6], alvo: [0, 0.4, 0] }, // de cima (compartilhar)
  { p: 0.85, pos: [5.2, 1.1, -4.8], alvo: [0, 0.8, 0] }, // 3/4 do outro lado
  { p: 1.0, pos: [6.2, 1.8, -4.4], alvo: [0, -0.3, 0] }, // 3/4, carro acima do título final
];

function progressoRolagem() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}

function Camera({
  progressoRef,
  giroRodasRef,
  semMovimento,
}: {
  progressoRef: React.RefObject<number>;
  giroRodasRef: React.RefObject<number>;
  semMovimento: boolean;
}) {
  const destino = useRef(new THREE.Vector3());
  const alvo = useRef(new THREE.Vector3());
  const olhar = useRef(new THREE.Vector3(0, 1.75, 0));

  // Objetos do three.js só são alterados dentro do laço de quadros
  // (useFrame), fora da renderização do React.
  useFrame(({ camera, size }, dt) => {
    // Tela estreita (celular): campo de visão maior para o carro caber.
    const cam = camera as THREE.PerspectiveCamera;
    const fov = size.width < 640 ? 52 : 34;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const p = semMovimento ? 0 : progressoRef.current;
    const quadro = quadroEm(QUADROS, p);
    destino.current.set(...quadro.pos);
    alvo.current.set(...quadro.alvo);
    // Amortecimento: a câmera persegue o destino em vez de saltar.
    const k = semMovimento ? 1 : 1 - Math.exp(-dt * 4);
    camera.position.lerp(destino.current, k);
    olhar.current.lerp(alvo.current, k);
    camera.lookAt(olhar.current);
    // Rodas giram conforme a rolagem: dá sensação de movimento.
    giroRodasRef.current = p * 40;
  });
  return null;
}

export default function CenaCarro({ semMovimento }: { semMovimento: boolean }) {
  const progresso = useRef(0);
  const giroRodas = useRef(0);
  // Celular: menos capim e resolução menor (o 3D é só fundo).
  const [leve] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const atualizar = () => {
      progresso.current = progressoRolagem();
    };
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      window.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, []);

  return (
    <Canvas
      dpr={leve ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [6.4, 1.4, 5.2], fov: 34, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      frameloop={semMovimento ? "demand" : "always"}
      // Sem WebGL: mostra a silhueta em SVG no lugar.
      fallback={
        <div className="grid h-full place-items-end justify-center pb-16">
          <SilhuetaCarro className="w-[min(80vw,640px)] text-destaque" />
        </div>
      }
    >
      <color attach="background" args={[COR_NEVOA]} />
      {/* Névoa exponencial: o carro fica nítido, o fundo some no cinza. */}
      <fogExp2 attach="fog" args={[COR_NEVOA, 0.06]} />

      <Camera
        progressoRef={progresso}
        giroRodasRef={giroRodas}
        semMovimento={semMovimento}
      />
      <Carro3D giroRodasRef={giroRodas} />
      <group position={[-5.4, 0, -2.2]} rotation-y={-0.2}>
        <Cavalo3D semMovimento={semMovimento} />
      </group>
      <Cenario semMovimento={semMovimento} leve={leve} />

      <ContactShadows
        position={[0, 0.005, 0]}
        scale={9}
        blur={2.6}
        opacity={0.8}
        far={2}
      />

      {/* Entardecer: luz fria e difusa do céu, quase sem sombra dura. */}
      <hemisphereLight args={["#7d979c", "#0b120e", 0.9]} />
      <directionalLight
        position={[-6, 9, -4]}
        intensity={0.9}
        color="#a9bec2"
      />

      {/* Reflexos da pintura: céu enevoado montado com Lightformers, gerado
          localmente (os presets do drei baixariam arquivos de terceiros). */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#9db3b8"
          position={[0, 7, 0]}
          rotation-x={Math.PI / 2}
          scale={[14, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#6f878c"
          position={[0, 1.5, -9]}
          scale={[20, 2.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.6}
          color="#6f878c"
          position={[0, 1.5, 9]}
          rotation-y={Math.PI}
          scale={[20, 2.5, 1]}
        />
      </Environment>
    </Canvas>
  );
}
