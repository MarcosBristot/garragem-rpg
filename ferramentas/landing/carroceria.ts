// Forma do carro da landing (cupê GT): esculpida por seções transversais
// ao longo do comprimento (um "loft"). Funções puras, testadas; a mesma
// forma é exportada para o Blender, onde a cena é renderizada.
// Design próprio: proporções de cupê GT, sem copiar um carro real (regra 6).
// Eixos: X = comprimento (frente em +X), Y = altura, Z = largura. Metros.

export const COMPRIMENTO = 4.9;
export const RODA_RAIO = 0.355;
export const EIXO_TRASEIRO = -1.47;
export const EIXO_DIANTEIRO = 1.43;
/** Raio da caixa de roda (um pouco maior que a roda). */
export const ARCO_RAIO = 0.45;
/**
 * Expoente da seção "superelipse": 2 seria uma elipse (lateral inflada);
 * valores maiores deixam a lateral reta e os cantos arredondados.
 */
const EXPOENTE = 4.5;
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

// Perfis (x → valor). Traseira em x = -2.45, frente em x = +2.45.
/**
 * Linha de cima: para-choque, tampa do porta-malas, vidro traseiro, teto,
 * para-brisa, capô longo e bico. A cabine fica recuada, como num GT.
 */
const TOPO: Ponto[] = [
  [-2.45, 0.6],
  [-2.38, 0.92],
  [-2.2, 1.0],
  [-1.75, 1.04],
  [-1.45, 1.1],
  [-0.75, 1.36],
  [-0.15, 1.38],
  [0.35, 1.3],
  [0.95, 1.02],
  [1.6, 0.93],
  [2.2, 0.83],
  [2.4, 0.71],
  [2.45, 0.56],
];
/** Linha de baixo (assoalho, ~16 cm do chão; pontas sobem nos para-choques). */
const BASE: Ponto[] = [
  [-2.45, 0.38],
  [-2.33, 0.24],
  [-2.05, 0.17],
  [2.05, 0.17],
  [2.33, 0.24],
  [2.45, 0.36],
];
/** Meia largura: quase constante (planta "retangular"), ombro traseiro largo. */
const LARGURA: Ponto[] = [
  [-2.45, 0.66],
  [-2.38, 0.88],
  [-2.1, 0.95],
  [-1.47, 0.97],
  [-0.6, 0.94],
  [0.6, 0.93],
  [1.43, 0.95],
  [2.15, 0.92],
  [2.38, 0.8],
  [2.45, 0.62],
];
/** Quanto o teto estreita em relação à lataria (1 = sem cabine). */
const CABINE: Ponto[] = [
  [-2.45, 1],
  [-1.85, 1],
  [-1.45, 0.78],
  [-1.0, 0.7],
  [0.5, 0.7],
  [0.95, 0.84],
  [1.15, 1],
  [2.45, 1],
];
/** Altura da linha de cintura (base das janelas, onde começa o ombro). */
const CINTURA = 0.95;

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
  const expoente = 2 / EXPOENTE;
  const seno = Math.sin(theta);
  const cosseno = Math.cos(theta);
  const centro = (s.topo + s.base) / 2;
  const meiaAltura = (s.topo - s.base) / 2;
  const y = centro + meiaAltura * Math.sign(seno) * Math.abs(seno) ** expoente;
  let z = s.meiaLargura * Math.sign(cosseno) * Math.abs(cosseno) ** expoente;

  // Acima da cintura a lateral "entra" até a largura do teto (tumblehome).
  // Começa já na cintura (sem rampa suave): é o que marca a linha de ombro.
  const subida =
    Math.min(
      1,
      Math.max(0, (y - CINTURA) / Math.max(0.05, s.topo - CINTURA)),
    ) ** 0.85;
  z *= 1 - (1 - s.cabine) * subida;

  // Caixas de roda: abaixo da linha do arco, a lateral recolhe para dentro
  // e fica atrás do pneu. Só a largura (z) muda, nunca a altura: subir a
  // borda fazia a superfície dobrar sobre si mesma (aparecia vista de cima).
  const dentroDoArco = suave((arcoEm(s.x) - y) / 0.05);
  z *= 1 - (1 - RECOLHIDO) * dentroDoArco;

  return [s.x, y, z];
}

/** A seção em u contém o ponto (y, z)? (Superelipse: (z/w)^n + (dy/h)^n ≤ 1.) */
function contem(u: number, y: number, z: number): boolean {
  const s = secaoEm(u);
  const centro = (s.topo + s.base) / 2;
  const meiaAltura = (s.topo - s.base) / 2;
  const dy = Math.abs(y - centro) / meiaAltura;
  if (dy >= 1) return false;
  return Math.abs(z) <= s.meiaLargura * (1 - dy ** EXPOENTE) ** (1 / EXPOENTE);
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

// ------------------------------------------------------------------
// Coordenadas da superfície (lado direito, z ≥ 0; o esquerdo é o espelho,
// v → 1 - v). Usadas para recortar as janelas na lataria.

/** u do ponto da lataria no comprimento x. */
export function uDoX(x: number): number {
  return (x + COMPRIMENTO / 2) / COMPRIMENTO;
}

/** v (lado direito) onde a lataria passa pela altura y na seção u. */
export function vNaAltura(u: number, y: number): number {
  // Em v de 0 (embaixo) a 0,5 (em cima) a altura só sobe: bisseção.
  let a = 0;
  let b = 0.5;
  for (let k = 0; k < 40; k++) {
    const m = (a + b) / 2;
    if (pontoCarroceria(u, m)[1] < y) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/** Faixas (em u e v) dos vidros, usadas para gerar as peças de vidro. */
// u = (x + 2,45) / 4,9. Em v, a cintura (y ≈ 1,0) cai perto de 0,27 e o
// alto da janela (y ≈ 1,3) perto de 0,38 (seção superelipse, expoente 4,5).
export const VIDROS = {
  /** Janelas laterais (cupê sem coluna central): x de -1,40 a 0,85. */
  lateral: { u: [0.214, 0.673], v: [0.274, 0.376] },
  /** Para-brisa: x de 0,35 a 0,95. */
  frente: { u: [0.571, 0.694], v: [0.388, 0.612] },
  /** Vidro traseiro: x de -1,45 a -0,75. */
  tras: { u: [0.204, 0.347], v: [0.392, 0.608] },
} as const;
