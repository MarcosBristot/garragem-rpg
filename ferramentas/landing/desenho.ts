// Desenho técnico do carro em vistas (lateral, topo, frente, traseira), em
// metros, rasterizado em imagens de 4 canais. O Blender projeta cada vista
// na lataria (projeção "triplanar": cada parte da superfície usa a vista
// para a qual está virada). Funções puras, testadas.

export type Ponto = readonly [number, number];

export type Vista = {
  /** Retângulo desenhado, em metros: horizontal [h0, h1], vertical [v0, v1]. */
  h0: number;
  h1: number;
  v0: number;
  v1: number;
  pxPorMetro: number;
  largura: number;
  altura: number;
  /** RGBA em float (0 a 1), linha 0 = topo da imagem (v1). */
  dados: Float32Array;
};

export function criarVista(
  [h0, h1]: Ponto,
  [v0, v1]: Ponto,
  pxPorMetro: number,
): Vista {
  const largura = Math.round((h1 - h0) * pxPorMetro);
  const altura = Math.round((v1 - v0) * pxPorMetro);
  return {
    h0,
    h1,
    v0,
    v1,
    pxPorMetro,
    largura,
    altura,
    dados: new Float32Array(largura * altura * 4),
  };
}

/** Metros → pixel (centro do pixel em .5). */
export function paraPixel(vista: Vista, [h, v]: Ponto): Ponto {
  return [(h - vista.h0) * vista.pxPorMetro, (vista.v1 - v) * vista.pxPorMetro];
}

export function ler(vista: Vista, px: number, py: number, canal: number) {
  return vista.dados[(py * vista.largura + px) * 4 + canal];
}

function pintar(
  vista: Vista,
  px: number,
  py: number,
  canal: number,
  valor: number,
) {
  const i = (py * vista.largura + px) * 4 + canal;
  if (valor > vista.dados[i]) vista.dados[i] = valor;
}

function distSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2),
        );
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

const limitar = (x: number) => Math.max(0, Math.min(1, x));

/** Linha (polilinha) com largura em metros e borda suave de 1 pixel. */
export function linha(
  vista: Vista,
  pontos: readonly Ponto[],
  larguraM: number,
  canal: number,
  valor = 1,
) {
  const meia = (larguraM * vista.pxPorMetro) / 2;
  const px = pontos.map((p) => paraPixel(vista, p));
  for (let k = 0; k < px.length - 1; k++) {
    const [a, b] = [px[k], px[k + 1]];
    const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0]) - meia - 1));
    const x1 = Math.min(
      vista.largura - 1,
      Math.ceil(Math.max(a[0], b[0]) + meia + 1),
    );
    const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1]) - meia - 1));
    const y1 = Math.min(
      vista.altura - 1,
      Math.ceil(Math.max(a[1], b[1]) + meia + 1),
    );
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = distSegmento([x + 0.5, y + 0.5], a, b);
        const cobre = limitar(meia - d + 0.5);
        if (cobre > 0) pintar(vista, x, y, canal, cobre * valor);
      }
    }
  }
}

function dentro(p: Ponto, poli: readonly Ponto[]): boolean {
  let d = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i];
    const [xj, yj] = poli[j];
    if (
      yi > p[1] !== yj > p[1] &&
      p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi
    ) {
      d = !d;
    }
  }
  return d;
}

/** Polígono preenchido (borda suave de 1 pixel). */
export function poligono(
  vista: Vista,
  pontos: readonly Ponto[],
  canal: number,
  valor = 1,
) {
  const px = pontos.map((p) => paraPixel(vista, p));
  const xs = px.map((p) => p[0]);
  const ys = px.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 1);
  const x1 = Math.min(vista.largura - 1, Math.ceil(Math.max(...xs)) + 1);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const y1 = Math.min(vista.altura - 1, Math.ceil(Math.max(...ys)) + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const c: Ponto = [x + 0.5, y + 0.5];
      let d = Infinity;
      for (let i = 0, j = px.length - 1; i < px.length; j = i++) {
        d = Math.min(d, distSegmento(c, px[j], px[i]));
      }
      const cobre = dentro(c, px) ? limitar(0.5 + d) : limitar(0.5 - d);
      if (cobre > 0) pintar(vista, x, y, canal, cobre * valor);
    }
  }
}

/** Contorno fechado de um polígono (linha que volta ao começo). */
export function contorno(
  vista: Vista,
  pontos: readonly Ponto[],
  larguraM: number,
  canal: number,
  valor = 1,
) {
  linha(vista, [...pontos, pontos[0]], larguraM, canal, valor);
}

const suave = (t: number) => {
  const c = limitar(t);
  return c * c * (3 - 2 * c);
};

/**
 * Faixa em relevo (mapa de altura) entre as curvas `baixo(h)` e `cima(h)`,
 * de h = ha a hb. As bordas sobem em `transicaoM` metros; as pontas
 * somem aos poucos em `fadeM` (sem degrau no fim do vinco).
 */
export function faixaRelevo(
  vista: Vista,
  [ha, hb]: Ponto,
  baixo: (h: number) => number,
  cima: (h: number) => number,
  transicaoM: number,
  fadeM: number,
  canal: number,
) {
  const [pa] = paraPixel(vista, [Math.min(ha, hb), 0]);
  const [pb] = paraPixel(vista, [Math.max(ha, hb), 0]);
  for (
    let x = Math.max(0, Math.floor(pa));
    x <= Math.min(vista.largura - 1, Math.ceil(pb));
    x++
  ) {
    const h = vista.h0 + (x + 0.5) / vista.pxPorMetro;
    const ponta = Math.min(h - Math.min(ha, hb), Math.max(ha, hb) - h);
    const fade = fadeM > 0 ? suave(ponta / fadeM) : 1;
    if (fade <= 0) continue;
    const yb = baixo(h);
    const yc = cima(h);
    for (let y = 0; y < vista.altura; y++) {
      const v = vista.v1 - (y + 0.5) / vista.pxPorMetro;
      const sobe = suave((v - yb) / transicaoM + 0.5);
      const desce = suave((yc - v) / transicaoM + 0.5);
      const valor = Math.min(sobe, desce) * fade;
      if (valor > 0) pintar(vista, x, y, canal, valor);
    }
  }
}

/** Espelha um polígono/linha no eixo horizontal (lado direito → esquerdo). */
export function espelhar(pontos: readonly Ponto[]): Ponto[] {
  return pontos.map(([h, v]) => [-h, v] as const);
}

/** Bytes RGBA 8 bits (para salvar como PNG). */
export function paraBytes(vista: Vista): Uint8Array {
  const out = new Uint8Array(vista.dados.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.round(limitar(vista.dados[i]) * 255);
  }
  return out;
}
