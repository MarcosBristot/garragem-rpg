# Landing: o carro no campo de flores

A landing não roda 3D no navegador. O fundo é uma **sequência de 48 quadros**
renderizados no Blender (a câmera dá uma volta parcial no carro) e a rolagem
escolhe o quadro (`src/components/landing/sequencia.ts`, testado). Por quê:

- **Licença:** modelos Royalty Free do CGTrader não podem ser extraídos por
  terceiros. Em 3D em tempo real o navegador baixa o arquivo do modelo; com
  imagens, só o render vai para o site.
- **Celular:** imagens leves no lugar de milhões de vértices de flores.
- **Visual:** iluminação de verdade (HDRI do céu, sombras, profundidade de
  campo), impossível de rodar ao vivo num celular comum.

## Arquivos

| Arquivo                   | O que faz                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `carroceria.ts` (+ teste) | Forma do nosso carro: funções puras (seções ao longo do comprimento, superelipse). Desenho próprio, sem marca.                                                                                  |
| `desenho.ts` (+ teste)    | Rasterizador do "desenho técnico": linhas, polígonos e relevo em metros, em imagens RGBA.                                                                                                       |
| `exportar-carro.mjs`      | Gera `carro.obj` (lataria com o vão das janelas, vidros, frit, coluna B), `carro.json` (luzes, rodas) e `detalhes_{lado,topo,frente,tras}.png`.                                                 |
| `cena_campo.py`           | Monta a cena no Blender: carro, peças pousadas na lataria (retrovisores, maçanetas, faróis, palhetas, escapamentos), interior, rodas, campo de anêmonas recoloridas, árvores, céu HDRI, câmera. |
| `renderizar-tudo.sh`      | Renderiza as duas sequências (1280×720 e 720×1280) no Cycles.                                                                                                                                   |
| `converter-quadros.mjs`   | PNG → WebP em `public/landing/campo/{desktop,mobile}/`.                                                                                                                                         |

## Como os detalhes chegam à lataria

A lataria é uma superfície só (um "loft"). Portas, capô, faróis e lanternas
não são peças separadas: são um **desenho técnico em quatro vistas**
(lateral, topo, frente, traseira), em metros, que o material do Blender
projeta na superfície. Cada ponto usa a vista para a qual está virado
(projeção triplanar). Canais de cada imagem:

- **R:** fresta entre peças (vira sulco escuro pelo bump);
- **G:** plástico preto fosco (saia, grade, difusor);
- **B:** luz (carcaça do farol, vidro da lanterna);
- **A:** extra (vincos de estilo na lateral/topo, lâminas da grade na
  frente, LEDs acesos na traseira).

Peças com volume (retrovisor, maçaneta, projetores, escapamentos) são
posicionadas por raycast na lataria, nas mesmas medidas do desenho.

## Passo a passo

Os modelos ficam **fora do Git** (pasta `MODELOS`, padrão
`C:/Users/Marcos/Ferramentas/garagem-modelos`):

```
MODELOS/
  ceu/ceu_4k.hdr                       HDRI CC0 (Poly Haven)
  flor/Anemone_Hybrida_BLEND/…blend    flor (Royalty Free, CGTrader)
  arvores/arvore.png, arvore-b.png     renders dos olmos (ver docs/creditos.md)
  nosso-carro/carro.obj, .json, .png    gerados pelo passo 1
```

```bash
# 1. Exportar o carro (Node 22+)
node --experimental-strip-types ferramentas/landing/exportar-carro.mjs "$MODELOS/nosso-carro/carro"
# 2. Renderizar (~3,5 h no Cycles; MOTOR=EEVEE para um teste rápido)
bash ferramentas/landing/renderizar-tudo.sh
# 3. Converter para WebP
node ferramentas/landing/converter-quadros.mjs "$SAIDA"
```

Para testar um quadro só: `cena_campo.py` aceita `quadros=0` e `salvar=cena.blend`
(abre no Blender para ajustar).

## Limites do computador (i5-9400F, RX 580 4 GB)

- A RX 580 não roda o Cycles (o Blender não tem suporte HIP para ela); o
  render final usa o processador: ~2 min por quadro com 64 amostras e
  denoise.
- No Eevee (testes), raytracing (`rt=1`) e névoa volumétrica (`nevoa=1`)
  estouram a memória: o quadro sai todo branco ou todo preto. Por padrão
  ficam desligados; a névoa do horizonte é simulada pela cor das árvores.
- Flores longe são "tufos" de 67 vértices; as perto usam a malha reduzida
  (`decimar_perto`).
