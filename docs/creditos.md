# Créditos e licenças de imagens 3D

Regra 6 do projeto: nada de arte de terceiros sem licença que permita o uso.
O que é de terceiros entra no site **só como imagem renderizada** (o arquivo
3D nunca é publicado nem versionado no Git).

| Arquivo no site           | O que aparece                    | Origem                                                                                                                                                        | Autor                               | Licença                      |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------- |
| `public/landing/campo/**` | O carro                          | Desenho próprio, gerado em código (`ferramentas/landing/carroceria.ts`). Inspirado no formato de um cupê GT, sem copiar carro nem marca reais.                | LifeInGears                         | Nosso                        |
| `public/landing/campo/**` | As flores do campo (recoloridas) | [XfrogPlants Anemone Hybrida (CGTrader, #2921926)](https://www.cgtrader.com/free-3d-models/plant/flower/xfrogplants-anemone-hybrida), gratuito                | xfrog (modelado por Konstantin Kim) | Royalty Free License (no AI) |
| `public/landing/campo/**` | Árvores no horizonte             | Renders do [American Elm01 tree (CGTrader, #3478609)](https://www.cgtrader.com/free-3d-models/plant/conifer/american-elm01-tree), usados como recortes planos | PANDORA-Land                        | Royalty Free License (no AI) |
| `public/landing/campo/**` | Céu e luz                        | HDRI [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Poly Haven                                      | Greg Zaal, Jarod Guest              | CC0                          |

Os quadros são renderizados no Blender (passo a passo em
`ferramentas/landing/README.md`).

## Marca e fontes

- Logo LifeInGears: enviado pelo dono do produto; traçado em SVG a partir das
  imagens originais (`src/components/logo.tsx`, `public/logo-*.svg`).
- Fontes: [Barlow](https://fonts.google.com/specimen/Barlow) e
  [Barlow Semi Condensed](https://fonts.google.com/specimen/Barlow+Semi+Condensed), licença SIL
  Open Font License (OFL), servidas pelo próprio site (next/font e
  @fontsource).

## Mapa

O mapa de encontros usa [MapLibre GL JS](https://maplibre.org) (licença BSD-3;
cópia do worker em `public/mapa/` com o cabeçalho da licença) e as imagens do
[OpenFreeMap](https://openfreemap.org) (estilo Positron, © OpenMapTiles),
com dados do [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL).
A atribuição aparece no canto do mapa.

## Por que só imagem

A licença Royalty Free do CGTrader permite o uso enquanto o modelo estiver
incorporado ao produto e terceiros não conseguirem retirá-lo. Num site com 3D em
tempo real o navegador baixa o arquivo do modelo (dá para salvá-lo), então
publicamos apenas renders. A licença "no AI" proíbe usar o modelo para treinar
IA; renderizar imagens não é isso.

## Recusados ou retirados

- Mercedes-AMG C63 (`.blend`): carro real; desenho e marca da montadora
  (regra 6).
- "Mercedes-Benz S63 Brabus" (CGTrader, gratuito): carro real com emblema da
  Brabus, e os arquivos indicam origem em downloads do Sketchfab (provável
  cópia não autorizada). Serviu só de referência de proporções para o nosso
  carro genérico.
- Cavalo (versão anterior da landing): removido do site junto com o cenário
  de entardecer.
