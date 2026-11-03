# Créditos e licenças de imagens 3D

Regra 6 do projeto: nada de arte de terceiros sem licença que permita o uso.
O que é de terceiros entra no site **só como imagem renderizada** (o arquivo
3D nunca é publicado nem versionado no Git).

| Arquivo no site | Origem | Autor | Licença | Como usamos |
| --- | --- | --- | --- | --- |
| `public/landing/arvore.webp`, `public/landing/arvore-b.webp` | [American Elm01 tree (CGTrader, #3478609)](https://www.cgtrader.com/free-3d-models/plant/conifer/american-elm01-tree) | PANDORA-Land | Royalty Free License (no AI) | Renderizada localmente em dois ângulos, com luz de entardecer; só a imagem vai para o site. |
| `public/landing/cavalo.webp` | Modelo "horse" (ZBrush 2018, OBJ de 3,75 mi de vértices) comprado no CGTrader | **a confirmar** | **a confirmar** (página do produto) | Renderizado localmente de perfil; só a imagem vai para o site. |

## Por que só imagem

A licença Royalty Free do CGTrader permite o uso enquanto o modelo estiver
incorporado ao produto e terceiros não conseguirem retirá-lo. Num site com 3D em
tempo real o navegador baixa o arquivo do modelo (dá para salvá-lo), então
publicamos apenas renders. A licença "no AI" proíbe usar o modelo para treinar
IA; renderizar imagens não é isso.

## Como refazer os renders

Os modelos originais ficam fora do projeto (pasta local do desenvolvedor). O
fluxo usado: converter o OBJ para um binário simples com o `OBJLoader` do
three.js (Node), renderizar numa página local com three.js (fundo
transparente, luz de entardecer, contra-luz), e converter o PNG com o `sharp`
(`trim`, WebP com alfa). Não versionar os modelos nem os PNGs brutos.

## Recusados

- Mercedes-AMG C63 (`.blend`): carro real; desenho e marca da montadora
  (regra 6). O carro do site é genérico, modelado em código.
