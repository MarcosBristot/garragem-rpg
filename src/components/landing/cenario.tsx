"use client";

// Cenário da landing: pasto ao entardecer com névoa, cerca de madeira,
// uma árvore grande e a linha de árvores sumindo ao fundo. Tudo gerado em
// código (sem texturas nem modelos de terceiros). Inspiração de clima, não
// cópia de imagem. Pseudoaleatório com semente fixa: a cena é sempre igual
// (servidor, navegador e capturas de tela batem).

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const COR_NEVOA = "#2a393d";

/** Gerador pseudoaleatório (mulberry32): mesma semente, mesma cena. */
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

/** Céu: degradê vertical, do escuro no alto à névoa no horizonte. */
function Ceu() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          alto: { value: new THREE.Color("#0b1214") },
          horizonte: { value: new THREE.Color("#33454a") },
        },
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 alto;
          uniform vec3 horizonte;
          varying vec3 vPos;
          void main() {
            float h = smoothstep(-0.05, 0.55, vPos.y);
            gl_FragColor = vec4(mix(horizonte, alto, h), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[60, 32, 16]} />
    </mesh>
  );
}

/** Chão e capim (milhares de folhas numa única chamada de desenho). */
function Pasto({ folhas }: { folhas: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const folha = useMemo(() => {
    // Folha fina e afinando para a ponta.
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [
          -0.012, 0, 0, 0.012, 0, 0, 0.004, 0.16, 0, -0.004, 0.16, 0, 0, 0.26,
          0,
        ],
        3,
      ),
    );
    g.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 4]);
    g.computeVertexNormals();
    return g;
  }, []);

  // Preenche posições e cores depois que a malha existe.
  useLayoutEffect(() => {
    {
      const malha = ref.current;
      if (!malha) return;
      const r = aleatorio(7);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const cor = new THREE.Color();
      for (let i = 0; i < folhas; i++) {
        const ang = r() * Math.PI * 2;
        const dist = 1.2 + Math.sqrt(r()) * 16;
        const x = Math.cos(ang) * dist;
        const z = Math.sin(ang) * dist;
        q.setFromEuler(
          new THREE.Euler((r() - 0.5) * 0.5, r() * Math.PI, (r() - 0.5) * 0.5),
        );
        const s = 0.6 + r() * 0.9;
        m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s, s));
        malha.setMatrixAt(i, m);
        cor.setHSL(0.36 + r() * 0.06, 0.25 + r() * 0.15, 0.07 + r() * 0.07);
        malha.setColorAt(i, cor);
      }
      malha.instanceMatrix.needsUpdate = true;
      if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
    }
  }, [folhas]);

  return (
    <>
      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#111c17" roughness={1} />
      </mesh>
      <instancedMesh
        ref={ref}
        args={[folha, undefined, folhas]}
        frustumCulled={false}
      >
        <meshStandardMaterial roughness={1} side={THREE.DoubleSide} />
      </instancedMesh>
    </>
  );
}

/** Cerca de madeira: mourões e três travessas, sumindo na névoa. */
function Cerca() {
  const geo = useMemo(() => {
    const pecas: THREE.BufferGeometry[] = [];
    const r = aleatorio(3);
    const zEm = (x: number) => -4.6 - 0.012 * x * x; // leve curva
    for (let x = -22; x <= 22; x += 2.6) {
      const poste = new THREE.BoxGeometry(0.12, 1.25, 0.12);
      poste.rotateZ((r() - 0.5) * 0.06);
      poste.translate(x, 0.62, zEm(x));
      pecas.push(poste);
      if (x + 2.6 > 22) break;
      const meio = x + 1.3;
      const comprimento = Math.hypot(2.6, zEm(x + 2.6) - zEm(x));
      const angulo = Math.atan2(zEm(x + 2.6) - zEm(x), 2.6);
      for (const altura of [0.42, 0.72, 1.02]) {
        const travessa = new THREE.BoxGeometry(comprimento, 0.09, 0.05);
        travessa.rotateY(-angulo);
        travessa.translate(meio, altura, zEm(meio));
        pecas.push(travessa);
      }
    }
    return mergeGeometries(pecas);
  }, []);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#2a2622" roughness={0.95} />
    </mesh>
  );
}

/** Copa feita de "nuvens" de folhagem deformadas (silhueta irregular). */
function copa(
  semente: number,
  centro: THREE.Vector3,
  raio: number,
  blocos: number,
) {
  const r = aleatorio(semente);
  const pecas: THREE.BufferGeometry[] = [];
  for (let i = 0; i < blocos; i++) {
    const g = new THREE.IcosahedronGeometry(raio * (0.35 + r() * 0.3), 2);
    const pos = g.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const k = 1 + (r() - 0.5) * 0.35;
      pos.setXYZ(j, pos.getX(j) * k, pos.getY(j) * k * 0.8, pos.getZ(j) * k);
    }
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * raio;
    g.translate(
      centro.x + Math.cos(a) * d,
      centro.y + (r() - 0.3) * raio * 0.45,
      centro.z + Math.sin(a) * d * 0.7,
    );
    pecas.push(g);
  }
  const unida = mergeGeometries(pecas);
  unida.computeVertexNormals();
  return unida;
}

/** Árvore grande: tronco, galhos abertos e copa larga. */
function Arvore() {
  const { madeira, folhagem } = useMemo(() => {
    const partes: THREE.BufferGeometry[] = [];
    const tronco = new THREE.CylinderGeometry(0.32, 0.55, 5.2, 14);
    tronco.translate(0, 2.6, 0);
    partes.push(tronco);
    const galhos: [number, number, number, number][] = [
      // [comprimento, inclinação, giro, altura]
      [4.2, 1.05, 2.6, 4.2],
      [3.6, 0.95, 0.4, 4.6],
      [3.0, 0.75, 4.2, 4.9],
      [2.6, 0.55, 1.6, 5.0],
    ];
    for (const [comp, incl, giro, alt] of galhos) {
      const g = new THREE.CylinderGeometry(0.08, 0.2, comp, 8);
      g.translate(0, comp / 2, 0);
      g.rotateZ(incl);
      g.rotateY(giro);
      g.translate(0, alt, 0);
      partes.push(g);
    }
    return {
      madeira: mergeGeometries(partes),
      folhagem: copa(11, new THREE.Vector3(-0.6, 6.4, 0), 4.6, 34),
    };
  }, []);
  return (
    <group position={[6.9, 0, -0.5]}>
      <mesh geometry={madeira}>
        <meshStandardMaterial color="#141210" roughness={1} />
      </mesh>
      <mesh geometry={folhagem}>
        <meshStandardMaterial color="#0f1915" roughness={1} />
      </mesh>
    </group>
  );
}

/** Linha de árvores ao fundo: só silhuetas, quase todas na névoa. */
function LinhaDeArvores() {
  const geo = useMemo(() => {
    const r = aleatorio(19);
    const pecas: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 46; i++) {
      const ang = Math.PI * (1.05 + r() * 0.9); // atrás da cerca (z < 0)
      const dist = 22 + r() * 12;
      const centro = new THREE.Vector3(
        Math.cos(ang) * dist,
        2 + r() * 2.5,
        Math.sin(ang) * dist,
      );
      pecas.push(copa(100 + i, centro, 2.2 + r() * 1.6, 5));
    }
    return mergeGeometries(pecas);
  }, []);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#121c19" roughness={1} />
    </mesh>
  );
}

/** Faixas de neblina rente ao chão, andando devagar. */
function Neblina({ semMovimento }: { semMovimento: boolean }) {
  const textura = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(160,180,184,0.55)");
    grad.addColorStop(1, "rgba(160,180,184,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  const faixas = useMemo(() => {
    const r = aleatorio(5);
    return Array.from({ length: 9 }, () => ({
      x: (r() - 0.5) * 30,
      z: -2 - r() * 14,
      y: 0.25 + r() * 0.6,
      escala: 9 + r() * 8,
      velocidade: 0.05 + r() * 0.08,
    }));
  }, []);
  const grupo = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (semMovimento || !grupo.current) return;
    grupo.current.children.forEach((filho, i) => {
      const f = faixas[i];
      filho.position.x =
        ((f.x + clock.elapsedTime * f.velocidade + 15) % 30) - 15;
    });
  });
  return (
    <group ref={grupo}>
      {faixas.map((f, i) => (
        <mesh key={i} position={[f.x, f.y, f.z]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[f.escala, f.escala * 0.45]} />
          <meshBasicMaterial
            map={textura}
            transparent
            depthWrite={false}
            opacity={0.5}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function Cenario({
  semMovimento,
  leve,
}: {
  semMovimento: boolean;
  /** Celular: menos capim. */
  leve: boolean;
}) {
  return (
    <>
      <Ceu />
      <Pasto folhas={leve ? 2500 : 7000} />
      <Cerca />
      <Arvore />
      <LinhaDeArvores />
      <Neblina semMovimento={semMovimento} />
    </>
  );
}
