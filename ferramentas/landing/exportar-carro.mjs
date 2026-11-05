// Exporta o nosso carro (carroceria.ts, nesta pasta) para o Blender:
// - carro.obj: lataria (com o vão das janelas aberto), vidros, faixas pretas
//   da borda dos vidros (frit) e coluna B;
// - carro.json: curvas das luzes e medidas das rodas;
// - detalhes_{lado,topo,frente,tras}.png: o "desenho técnico" do carro em
//   vistas (vincos, áreas pretas, faróis, lanternas), projetado na lataria.
// Uso: node --experimental-strip-types exportar-carro.mjs <modelos>/nosso-carro/carro
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";

const c = await import(new URL("./carroceria.ts", import.meta.url).href);
const d = await import(new URL("./desenho.ts", import.meta.url).href);
const [saida] = process.argv.slice(2);
if (!saida) throw new Error("Informe o caminho de saída (sem extensão).");
const pasta = dirname(saida);

// Blender usa Z para cima: (x, y, z) do three -> (x, -z, y).
const paraBlender = ([x, y, z]) => [x, -z, y];

// ------------------------------------------------------------ janelas
const CINTURA_VIDRO = 0.97;
function faixaJanela(u) {
  const s = c.secaoEm(u);
  const alto = s.topo - 0.07;
  if (alto - CINTURA_VIDRO < 0.06) return null; // sem altura para janela
  return [c.vNaAltura(u, CINTURA_VIDRO), c.vNaAltura(u, alto)];
}
const U_JANELA = [0.205, 0.66];
const U_FRENTE = [0.575, 0.69];
const U_TRAS = [0.21, 0.345];
// Para-brisa e vidro traseiro: a faixa de cima, entre as colunas.
const faixaTopo = (u) => {
  const f = faixaJanela(u);
  return f && [f[1] + 0.02, 1 - f[1] - 0.02];
};
const espelho = (f) => f && [1 - f[1], 1 - f[0]];

/** Os vãos (em u e v) onde a lataria é aberta: um pouco menores que o vidro. */
const FOLGA = 0.006; // a borda da lataria fica escondida sob o frit
const vaos = [
  [U_JANELA, faixaJanela],
  [U_JANELA, (u) => espelho(faixaJanela(u))],
  [U_FRENTE, faixaTopo],
  [U_TRAS, faixaTopo],
];
function noVao(u, v) {
  for (const [[u0, u1], faixa] of vaos) {
    if (u < u0 + FOLGA || u > u1 - FOLGA) continue;
    const f = faixa(u);
    if (f && v > f[0] + FOLGA && v < f[1] - FOLGA) return true;
  }
  return false;
}

// ---------------------------------------------------------------- OBJ
let obj = "# Carro Garagem RPG (gerado por carroceria.ts)\n";
let base = 1;
const vert = (p) => {
  const [bx, by, bz] = paraBlender(p);
  obj += `v ${bx.toFixed(5)} ${by.toFixed(5)} ${bz.toFixed(5)}\n`;
};
function afastado(u, v, afastar) {
  let [x, y, z] = c.pontoCarroceria(u, v);
  const s = c.secaoEm(u);
  const centro = (s.topo + s.base) / 2;
  y = centro + (y - centro) * (1 + afastar);
  z *= 1 + afastar;
  return [x, y, z];
}

// Lataria: grade u × v, sem as faces dos vãos, e tampas nas pontas (o
// bico e a traseira: leque até o centro da seção).
// As linhas em v não são uniformes: na superelipse, v "corre" no meio da
// lateral e no meio do teto (lá uma linha uniforme ficava a ~10 cm da
// outra e as bordas dos arcos saíam serrilhadas). Em cada quarto da seção,
// θ = 90° · g(w), com g(w) = wᵃ / (wᵃ + (1 - w)ᵃ): denso nas duas pontas.
const POR_QUARTO = 64;
const linhasV = (() => {
  const a = 2.25; // 1 / (2 / EXPOENTE): desfaz a potência da superelipse
  const g = (w) => w ** a / (w ** a + (1 - w) ** a);
  const vs = [];
  for (let q = 0; q < 4; q++) {
    for (let k = 0; k < POR_QUARTO; k++) vs.push((q + g(k / POR_QUARTO)) / 4);
  }
  vs.push(1);
  return vs;
})();
{
  const NU = 480;
  const NV = linhasV.length - 1;
  obj += "o lataria\n";
  for (let i = 0; i <= NU; i++) {
    for (const v of linhasV) vert(c.pontoCarroceria(i / NU, v));
  }
  const w = NV + 1;
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      if (noVao((i + 0.5) / NU, (linhasV[j] + linhasV[j + 1]) / 2)) continue;
      const a = base + i * w + j;
      obj += `f ${a} ${a + w} ${a + w + 1} ${a + 1}\n`;
    }
  }
  const total = (NU + 1) * w;
  for (const [i, sentido] of [
    [0, 1],
    [NU, -1],
  ]) {
    const s = c.secaoEm(i / NU);
    vert([s.x, (s.topo + s.base) / 2, 0]);
    const centro = base + total + (i === 0 ? 0 : 1);
    for (let j = 0; j < NV; j++) {
      const a = base + i * w + j;
      obj +=
        sentido > 0
          ? `f ${centro} ${a + 1} ${a}\n`
          : `f ${centro} ${a} ${a + 1}\n`;
    }
  }
  base += total + 2;
}

/** Malha entre duas curvas em v que variam com u (vidros, frit). */
function malhaVariavel(nome, [u0, u1], nu, nv, faixa, afastar) {
  obj += `o ${nome}\n`;
  const linhas = [];
  for (let i = 0; i <= nu; i++) {
    const u = u0 + ((u1 - u0) * i) / nu;
    const f = faixa(u);
    if (f && f[1] > f[0]) linhas.push([u, f]);
  }
  for (const [u, [v0, v1]] of linhas) {
    for (let j = 0; j <= nv; j++)
      vert(afastado(u, v0 + ((v1 - v0) * j) / nv, afastar));
  }
  const w = nv + 1;
  for (let i = 0; i < linhas.length - 1; i++) {
    for (let j = 0; j < nv; j++) {
      const a = base + i * w + j;
      obj += `f ${a} ${a + w} ${a + w + 1} ${a + 1}\n`;
    }
  }
  base += linhas.length * w;
  return linhas;
}

const VIDRO = 0.004;
const ladoDir = malhaVariavel(
  "vidro_lateral_dir",
  U_JANELA,
  120,
  16,
  faixaJanela,
  VIDRO,
);
malhaVariavel(
  "vidro_lateral_esq",
  U_JANELA,
  120,
  16,
  (u) => espelho(faixaJanela(u)),
  VIDRO,
);
malhaVariavel("vidro_frente", U_FRENTE, 30, 40, faixaTopo, VIDRO);
malhaVariavel("vidro_tras", U_TRAS, 30, 40, faixaTopo, VIDRO);

// Frit: a faixa preta pintada na borda do vidro (todo carro tem). Fica logo
// por dentro do vidro e esconde a borda serrilhada do vão da lataria.
const FRIT = 0.0035;
const LARG_FRIT = 0.012; // em v
const U_FRIT = 0.01; // nas pontas, em u
function bordas(nome, [u0, u1], faixa, nv) {
  const corta = (f, a, b) => f && [Math.max(f[0], a), Math.min(f[1], b)];
  malhaVariavel(
    `frit_${nome}_a`,
    [u0, u1],
    120,
    4,
    (u) => {
      const f = faixa(u);
      return corta(f, f?.[0], (f?.[0] ?? 0) + LARG_FRIT);
    },
    FRIT,
  );
  malhaVariavel(
    `frit_${nome}_b`,
    [u0, u1],
    120,
    4,
    (u) => {
      const f = faixa(u);
      return corta(f, (f?.[1] ?? 0) - LARG_FRIT, f?.[1]);
    },
    FRIT,
  );
  malhaVariavel(`frit_${nome}_c`, [u0, u0 + U_FRIT], 6, nv, faixa, FRIT);
  malhaVariavel(`frit_${nome}_d`, [u1 - U_FRIT, u1], 6, nv, faixa, FRIT);
}
bordas("lateral_dir", U_JANELA, faixaJanela, 16);
bordas("lateral_esq", U_JANELA, (u) => espelho(faixaJanela(u)), 16);
bordas("frente", U_FRENTE, faixaTopo, 40);
bordas("tras", U_TRAS, faixaTopo, 40);
// Coluna B: divide a janela da porta da janela traseira (x ≈ -0,86).
const U_COLUNA = [c.uDoX(-0.875), c.uDoX(-0.845)];
malhaVariavel("frit_coluna_dir", U_COLUNA, 4, 16, faixaJanela, FRIT);
malhaVariavel(
  "frit_coluna_esq",
  U_COLUNA,
  4,
  16,
  (u) => espelho(faixaJanela(u)),
  FRIT,
);

writeFileSync(`${saida}.obj`, obj);

// --------------------------------------------------------------- JSON
// Friso escuro em volta da janela (direita; o Blender espelha).
const friso = [
  ...ladoDir.map(([u, [v0]]) => c.pontoCarroceria(u, v0)),
  ...ladoDir
    .slice()
    .reverse()
    .map(([u, [, v1]]) => c.pontoCarroceria(u, v1)),
].map((p) => paraBlender([p[0], p[1], p[2] * 1.006]));

// Desenho dos faróis e lanternas (vista de frente/de trás, lado direito:
// horizontal = z, vertical = y). Os mesmos contornos vão para a textura e
// para as luzes 3D, então ficam sempre alinhados.
const FAROL = [
  [0.3, 0.64],
  [0.3, 0.7],
  [0.55, 0.725],
  [0.8, 0.735],
  [0.88, 0.705],
  [0.86, 0.66],
  [0.6, 0.645],
];
const LANTERNA = [
  [0.3, 0.785],
  [0.3, 0.845],
  [0.8, 0.865],
  [0.9, 0.835],
  [0.88, 0.775],
  [0.6, 0.77],
];
// Luz diurna: ao longo da borda de cima do farol, 1 cm para dentro.
const drl = (lado) =>
  Array.from({ length: 25 }, (_, i) => {
    const z = 0.32 + (i / 24) * 0.52;
    const y =
      (z < 0.55
        ? 0.7 + ((z - 0.3) / 0.25) * 0.025
        : 0.725 + ((z - 0.55) / 0.25) * 0.01) - 0.012;
    return paraBlender([c.xDianteiroEm(y, z) + 0.003, y, lado * z]);
  });
const rodas = [c.EIXO_TRASEIRO, c.EIXO_DIANTEIRO].flatMap((x) =>
  [-0.8, 0.8].map((z) => paraBlender([x, c.RODA_RAIO, z])),
);
writeFileSync(
  `${saida}.json`,
  JSON.stringify(
    {
      friso,
      farois: [drl(1), drl(-1)],
      rodas,
      rodaRaio: c.RODA_RAIO,
      arcoRaio: c.ARCO_RAIO,
      // Vistas: retângulos em metros (o Blender projeta com as mesmas medidas).
      vistas: {
        lado: { h: [-2.5, 2.5], v: [0, 1.5] },
        topo: { h: [-2.5, 2.5], v: [-1, 1] },
        frente: { h: [-1, 1], v: [0, 1.5] },
        tras: { h: [-1, 1], v: [0, 1.5] },
      },
    },
    null,
    1,
  ),
);

// ------------------------------------------------------------ desenhos
// Canais: R = vinco (fresta entre peças), G = plástico preto fosco,
// B = luz (carcaça do farol / vidro da lanterna), A = extra (relevo na
// lateral e no topo, lâminas da grade na frente, LEDs na traseira).
const VINCO = 0;
const PRETO = 1;
const LUZ = 2;
const EXTRA = 3;
const FRESTA = 0.0045; // 4,5 mm
const PX = 820; // px por metro (~1,2 mm por pixel)
const ambos = (pts, f) => {
  f(pts);
  f(d.espelhar(pts));
};

// Lateral: horizontal = x (frente em +x), vertical = y.
const lado = d.criarVista([-2.5, 2.5], [0, 1.5], PX);
{
  // Porta longa de cupê: frente logo atrás do arco dianteiro, traseira
  // inclinada acompanhando a coluna.
  d.linha(
    lado,
    [
      [0.95, 0.37],
      [0.95, 0.7],
      [0.9, 0.96],
    ],
    FRESTA,
    VINCO,
  );
  d.linha(
    lado,
    [
      [-0.8, 0.37],
      [-0.84, 0.7],
      [-0.9, 0.96],
    ],
    FRESTA,
    VINCO,
  );
  d.linha(
    lado,
    [
      [-0.8, 0.37],
      [0.95, 0.37],
    ],
    FRESTA,
    VINCO,
  );
  // Contorno da maçaneta embutida.
  d.contorno(
    lado,
    [
      [-0.53, 0.84],
      [-0.31, 0.84],
      [-0.3, 0.86],
      [-0.31, 0.882],
      [-0.53, 0.882],
      [-0.54, 0.86],
    ],
    0.003,
    VINCO,
  );
  // Tampa do combustível (círculo sobre o arco traseiro).
  d.contorno(
    lado,
    Array.from({ length: 48 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return [-1.25 + Math.cos(a) * 0.085, 0.855 + Math.sin(a) * 0.085];
    }),
    0.0035,
    VINCO,
  );
  // Para-choque traseiro (continua na vista de trás, na mesma altura).
  d.linha(
    lado,
    [
      [-1.93, 0.66],
      [-2.1, 0.7],
      [-2.6, 0.7],
    ],
    FRESTA,
    VINCO,
  );
  // Para-lama dianteiro / para-choque.
  d.linha(
    lado,
    [
      [1.86, 0.62],
      [2.0, 0.66],
      [2.12, 0.8],
    ],
    FRESTA,
    VINCO,
  );
  // Fundo das caixas de roda: a lataria recolhida dentro do arco fica preta.
  for (const eixo of [c.EIXO_TRASEIRO, c.EIXO_DIANTEIRO]) {
    d.poligono(
      lado,
      Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        const r = c.ARCO_RAIO - 0.004;
        return [eixo + Math.cos(a) * r, c.RODA_RAIO + Math.sin(a) * r];
      }),
      PRETO,
    );
  }
  // Saia lateral preta entre as rodas.
  d.poligono(
    lado,
    [
      [-1.0, 0.1],
      [0.96, 0.1],
      [0.96, 0.3],
      [0.9, 0.33],
      [-0.94, 0.33],
      [-1.0, 0.3],
    ],
    PRETO,
  );
  // Vincos de estilo: linha de ombro e a linha que sobe da porta para a
  // traseira (como nos cupês GT).
  d.faixaRelevo(
    lado,
    [-1.05, 0.95],
    (x) => 0.5 + ((0.95 - x) / 2.0) * 0.14,
    () => 0.84,
    0.014,
    0.35,
    EXTRA,
  );
}

// Topo: horizontal = x, vertical = z (lado direito em +z).
const topo = d.criarVista([-2.5, 2.5], [-1, 1], PX);
{
  // Capô: laterais, frente curva e traseira (base do para-brisa).
  const frenteCapo = Array.from({ length: 33 }, (_, i) => {
    const z = 0.8 - (i / 32) * 1.6;
    return [2.25 - 0.06 * (z / 0.8) ** 2, z];
  });
  d.linha(
    topo,
    [[1.02, 0.8], ...frenteCapo, [1.02, -0.8], [1.02, 0.8]],
    FRESTA,
    VINCO,
  );
  // Tampa do porta-malas (continua na vista de trás).
  d.linha(
    topo,
    [
      [-1.47, 0.7],
      [-2.6, 0.7],
    ],
    FRESTA,
    VINCO,
  );
  d.linha(
    topo,
    [
      [-1.47, -0.7],
      [-2.6, -0.7],
    ],
    FRESTA,
    VINCO,
  );
  d.linha(
    topo,
    [
      [-1.47, 0.7],
      [-1.47, -0.7],
    ],
    FRESTA,
    VINCO,
  );
  // Grelha preta na base do para-brisa (onde ficam as palhetas).
  d.poligono(
    topo,
    [
      [0.97, 0.76],
      [1.05, 0.78],
      [1.05, -0.78],
      [0.97, -0.76],
    ],
    PRETO,
  );
  // Dois vincos no capô (o "domo" do motor).
  d.faixaRelevo(
    topo,
    [1.1, 2.15],
    () => -0.36,
    () => 0.36,
    0.02,
    0.25,
    EXTRA,
  );
}

// Frente: horizontal = z (direita do carro em +z), vertical = y.
const frente = d.criarVista([-1, 1], [0, 1.5], PX);
{
  ambos(FAROL, (p) => d.poligono(frente, p, LUZ));
  // Grade superior entre os faróis (preto brilhante, com lâminas).
  const grade = [
    [-0.24, 0.52],
    [0.24, 0.52],
    [0.27, 0.6],
    [0.24, 0.69],
    [-0.24, 0.69],
    [-0.27, 0.6],
  ];
  d.poligono(frente, grade, LUZ);
  d.poligono(frente, grade, EXTRA);
  // Entrada de ar inferior, larga, e as laterais.
  const baixa = [
    [-0.6, 0.22],
    [0.6, 0.22],
    [0.64, 0.3],
    [0.6, 0.46],
    [-0.6, 0.46],
    [-0.64, 0.3],
  ];
  d.poligono(frente, baixa, PRETO);
  d.poligono(frente, baixa, EXTRA);
  ambos(
    [
      [0.68, 0.26],
      [0.86, 0.28],
      [0.88, 0.45],
      [0.7, 0.47],
    ],
    (p) => d.poligono(frente, p, PRETO),
  );
}

// Traseira: horizontal = z, vertical = y.
const tras = d.criarVista([-1, 1], [0, 1.5], PX);
{
  ambos(LANTERNA, (p) => d.poligono(tras, p, LUZ));
  // LEDs: contorno interno de cada lanterna + barra de luz entre elas.
  const dentro = LANTERNA.map(([z, y]) => [
    0.6 + (z - 0.6) * 0.93,
    0.817 + (y - 0.817) * 0.6,
  ]);
  ambos(dentro, (p) => d.contorno(tras, p, 0.006, EXTRA));
  d.linha(
    tras,
    [
      [-0.3, 0.815],
      [0.3, 0.815],
    ],
    0.008,
    EXTRA,
  );
  d.linha(
    tras,
    [
      [-0.3, 0.815],
      [0.3, 0.815],
    ],
    0.02,
    LUZ,
  );
  // Tampa do porta-malas e para-choque.
  d.linha(
    tras,
    [
      [0.7, 1.2],
      [0.7, 0.875],
      [-0.7, 0.875],
      [-0.7, 1.2],
    ],
    FRESTA,
    VINCO,
  );
  d.linha(
    tras,
    [
      [-1, 0.7],
      [1, 0.7],
    ],
    FRESTA,
    VINCO,
  );
  // Difusor preto.
  d.poligono(
    tras,
    [
      [-0.78, 0.17],
      [0.78, 0.17],
      [0.8, 0.3],
      [0.72, 0.4],
      [-0.72, 0.4],
      [-0.8, 0.3],
    ],
    PRETO,
  );
}

for (const [nome, vista] of Object.entries({ lado, topo, frente, tras })) {
  await sharp(Buffer.from(d.paraBytes(vista)), {
    raw: { width: vista.largura, height: vista.altura, channels: 4 },
  })
    .png()
    .toFile(join(pasta, `detalhes_${nome}.png`));
}
console.log("ok", (obj.length / 1e6).toFixed(1), "MB de OBJ + 4 desenhos");
