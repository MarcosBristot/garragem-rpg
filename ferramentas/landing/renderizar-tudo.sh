#!/bin/bash
# Renderiza as duas sequências da landing (computador e celular): 48 quadros
# cada, a câmera dando uma volta parcial no carro. Cycles no processador
# (luz realista: reflexos, sombras suaves, luz indireta nas flores):
# ~2 min por quadro num i5-9400F, ~3,5 h no total.
#
# Variáveis (com padrões da máquina do desenvolvedor):
#   BLENDER  executável do Blender 4.3
#   MODELOS  pasta com ceu/, flor/, arvores/ e nosso-carro/ (fora do Git)
#   SAIDA    onde ficam os PNGs (renders/desktop e renders/mobile)
set -e
B="${BLENDER:-/c/Users/Marcos/Ferramentas/blender-4.3.2-windows-x64/blender.exe}"
M="${MODELOS:-/c/Users/Marcos/Ferramentas/garagem-modelos}"
S="${SAIDA:-$M/../garagem-renders}"
AQUI="$(cd "$(dirname "$0")" && pwd)"
QUADROS=$(seq -s, 0 47)
mkdir -p "$S/desktop" "$S/mobile"

# A placa (RX 580) não roda Cycles (sem suporte HIP) e no Eevee o raytracing
# estoura os 4 GB; por isso o processador. Teste rápido: motor=EEVEE.
COMUM="motor=${MOTOR:-CYCLES} amostras=${AMOSTRAS:-64} f=4 total=48 inicio=35 varredura=200 decimar_perto=0.12 quadros=$QUADROS prefixo=quadro"

"$B" -b --disable-autoexec --python "$AQUI/cena_campo.py" -- dir="$M" saida="$S/desktop" \
  larg=1280 alt=720 lente=45 dist=11 alvo_z=1.25 $COMUM 2>&1 | grep -E "RENDER|Error|Traceback" || true
"$B" -b --disable-autoexec --python "$AQUI/cena_campo.py" -- dir="$M" saida="$S/mobile" \
  larg=720 alt=1280 lente=30 dist=10.5 alvo_z=1.8 $COMUM 2>&1 | grep -E "RENDER|Error|Traceback" || true
echo FIM
