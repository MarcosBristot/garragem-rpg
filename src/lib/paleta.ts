// Paleta da identidade visual: névoa ao entardecer (azul-esverdeado escuro)
// com o vermelho da lanterna como destaque. Os tokens do Tailwind ficam em
// globals.css (@theme); estes valores servem onde CSS não chega: imagens
// geradas (next/og), 3D e SVG. Um teste confere que os dois batem e que os
// contrastes seguem a regra de acessibilidade do projeto.

export const PALETA = {
  fundo: "#0a0f10",
  superficie: "#111a1c",
  superficie2: "#182326",
  borda: "#26353a",
  bordaCampo: "#64777c",
  texto: "#e6ecec",
  textoSecundario: "#a2b1b3",
  textoApagado: "#86979a",
  destaque: "#ff5a4a",
  condicao: "#4ade80",
  /** Cor da névoa do cenário (não é usada para texto). */
  nevoa: "#5f7477",
} as const;

/** "#ff5a4a" + 0.3 → "rgba(255, 90, 74, 0.3)" (next/og não lê color-mix). */
export function comAlfa(hex: string, alfa: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

/** Contraste WCAG 2 entre duas cores hex (1 a 21). */
export function contraste(a: string, b: string): number {
  const luminancia = (hex: string) => {
    const [r, g, bl] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}
