// Forma da carroceria do esportivo genérico da landing: esculpida por
// seções transversais ao longo do comprimento (um "loft"), em vez de um
// perfil esticado. Funções puras (sem three.js) para poder testar medidas.
// Design próprio, sem copiar um carro real (regra de propriedade intelectual).
// Eixos: X = comprimento (frente em +X), Y = altura, Z = largura. Metros.

export const COMPRIMENTO = 4.5;
export const RODA_RAIO = 0.34;
export const EIXO_TRASEIRO = -1.38;
export const EIXO_DIANTEIRO = 1.36;
/** Raio da caixa de roda (um pouco maior que a roda). */
export const ARCO_RAIO = 0.44;
/** Dentro do arco, a lateral recolhe para esta fração da largura. */
const RECOLHIDO = 0.5;

type Ponto = readonly [number, number];

/**
 * Interpolação cúbica monótona (Fritsch–Carlson): passa pelos pontos sem
 * "ondular" entre eles (um spline comum criaria calombos na lataria).
 */
export function curva(pontos: readonly Ponto[], x: number): number {
  const n = pontos.length;
  if (x <= pontos[0][0]) return pontos[0][1];
  if (x >= pontos[n - 1][0]) return pontos[n - 1][1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push(
      (pontos[i + 1][1] - pontos[i][1]) / (pontos[i + 1][0] - pontos[i][0]),
    );
  }
  const m = pontos.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    return d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  });
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let i = 0;
  while (x > pontos[i + 1][0]) i++;
  const [x0, y0] = pontos[i];
  const [x1, y1] = pontos[i + 1];
  const h = x1 - x0;
  const t = (x - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * m[i] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * m[i + 1]
  );
}

// Perfis (x → valor). Traseira em x = -2.25, frente em x = +2.25.
/** Linha de cima: tampa traseira, caimento fastback, teto, para-brisa, capô. */
const TOPO: Ponto[] = [
  [-2.25, 0.52],
  [-2.2, 0.84],
  [-1.98, 0.95],
  [-1.25, 1.1],
  [-0.45, 1.26],
  [0.15, 1.24],
  [0.78, 0.99],
  [1.45, 0.88],
  [1.98, 0.77],
  [2.2, 0.62],
  [2.25, 0.46],
];
/** Linha de baixo (assoalho, ~18 cm do chão). */
const BASE: Ponto[] = [
  [-2.25, 0.36],
  [-2.16, 0.23],
  [-1.85, 0.19],
  [1.85, 0.19],
  [2.14, 0.27],
  [2.25, 0.4],
];
/** Meia largura: traseira larga ("ombros"), para-lamas sobre as rodas. */
const LARGURA: Ponto[] = [
  [-2.25, 0.5],
  [-2.17, 0.84],
  [-1.85, 0.95],
  [-1.38, 0.97],
  [-0.7, 0.91],
  [0.4, 0.89],
  [1.36, 0.93],
  [1.95, 0.87],
  [2.18, 0.7],
  [2.25, 0.46],
];
/** Quanto o teto estreita em relação à lataria (1 = sem cabine). */
const CABINE: Ponto[] = [
  [-2.25, 1],
  [-2.0, 0.92],
  [-1.4, 0.68],
  [0.55, 0.68],
  [0.95, 0.95],
  [1.2, 1],
  [2.25, 1],
];
/** Altura da linha de cintura (base das janelas). */
const CINTURA = 0.93;

export type Secao = {
  x: number;
  topo: number;
  base: number;
  meiaLargura: number;
  cabine: number;
};

export function secaoEm(u: number): Secao {
  const x = -COMPRIMENTO / 2 + u * COMPRIMENTO;
  return {
    x,
    topo: curva(TOPO, x),
    base: curva(BASE, x),
    meiaLargura: curva(LARGURA, x),
    cabine: curva(CABINE, x),
  };
}

const suave = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

/** Altura do arco da caixa de roda em x (ou -Infinity fora dele). */
function arcoEm(x: number): number {
  for (const eixo of [EIXO_TRASEIRO, EIXO_DIANTEIRO]) {
    const dx = x - eixo;
    if (Math.abs(dx) < ARCO_RAIO) {
      return RODA_RAIO + Math.sqrt(ARCO_RAIO * ARCO_RAIO - dx * dx);
    }
  }
  return -Infinity;
}

/**
 * Ponto da superfície. u ∈ [0, 1] ao longo do comprimento; v ∈ [0, 1] em
 * volta da seção (0 = embaixo no centro, 0.25 = lateral direita +Z,
 * 0.5 = em cima, 0.75 = lateral esquerda). Seção "superelipse": laterais
 * quase retas e cantos arredondados, como lataria de verdade.
 */
export function pontoCarroceria(
  u: number,
  v: number,
): [number, number, number] {
  const s = secaoEm(u);
  const theta = -Math.PI / 2 + v * Math.PI * 2;
  const expoente = 2 / 3.2;
  const seno = Math.sin(theta);
  const cosseno = Math.cos(theta);
  const centro = (s.topo + s.base) / 2;
  const meiaAltura = (s.topo - s.base) / 2;
  const y = centro + meiaAltura * Math.sign(seno) * Math.abs(seno) ** expoente;
  let z = s.meiaLargura * Math.sign(cosseno) * Math.abs(cosseno) ** expoente;

  // Acima da cintura a lateral "entra" até a largura do teto (tumblehome).
  const subida = suave((y - CINTURA) / Math.max(0.05, s.topo - CINTURA));
  z *= 1 - (1 - s.cabine) * subida;

  // Caixas de roda: abaixo da linha do arco, a lateral recolhe para dentro
  // e fica atrás do pneu. Só a largura (z) muda, nunca a altura: subir a
  // borda fazia a superfície dobrar sobre si mesma (aparecia vista de cima).
  const dentroDoArco = suave((arcoEm(s.x) - y) / 0.05);
  z *= 1 - (1 - RECOLHIDO) * dentroDoArco;

  return [s.x, y, z];
}

/** A seção em u contém o ponto (y, z)? (Superelipse: (z/w)^3,2 + (dy/h)^3,2 ≤ 1.) */
function contem(u: number, y: number, z: number): boolean {
  const s = secaoEm(u);
  const centro = (s.topo + s.base) / 2;
  const meiaAltura = (s.topo - s.base) / 2;
  const dy = Math.abs(y - centro) / meiaAltura;
  if (dy >= 1) return false;
  return Math.abs(z) <= s.meiaLargura * (1 - dy ** 3.2) ** (1 / 3.2);
}

/**
 * x da traseira (o ponto mais para trás da lataria) na altura y e na
 * lateral z. Serve para pousar peças sobre a superfície (lanterna, difusor,
 * escapes): a traseira é curva, então cada ponto fica num x diferente.
 */
export function xTraseiroEm(y: number, z: number): number {
  for (let u = 0; u <= 0.25; u += 0.0005) {
    if (contem(u, y, z)) return secaoEm(u).x;
  }
  return -COMPRIMENTO / 2;
}

/** O mesmo, na frente (faróis). */
export function xDianteiroEm(y: number, z: number): number {
  for (let u = 1; u >= 0.75; u -= 0.0005) {
    if (contem(u, y, z)) return secaoEm(u).x;
  }
  return COMPRIMENTO / 2;
}

/** Faixas (em u e v) dos vidros, usadas para gerar as peças de vidro. */
export const VIDROS = {
  /** Janelas laterais, entre as colunas. */
  lateral: { u: [0.17, 0.66], v: [0.29, 0.37] },
  /** Para-brisa. */
  frente: { u: [0.53, 0.68], v: [0.38, 0.62] },
  /** Vidro traseiro, no caimento. */
  tras: { u: [0.16, 0.3], v: [0.41, 0.59] },
} as const;
