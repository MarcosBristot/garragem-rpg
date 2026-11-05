// Paleta da identidade visual: de dia, campo de flores sob céu com nuvens
// (fundo claro levemente lavanda, texto grafite, destaque violeta). Os
// tokens do Tailwind ficam em globals.css (@theme); estes valores servem
// onde CSS não chega: imagens geradas (next/og), 3D e SVG. Um teste confere
// que os dois batem e que os contrastes seguem a regra de acessibilidade.

export const PALETA = {
  fundo: "#f6f5fb",
  superficie: "#ffffff",
  superficie2: "#eeecf7",
  borda: "#dedaee",
  bordaCampo: "#837e98",
  texto: "#1c1a26",
  textoSecundario: "#4c485c",
  textoApagado: "#625e74",
  destaque: "#5b3fd0",
  condicao: "#167a3d",
  erro: "#b42318",
  /** Azul do céu (só fundos, nunca texto). */
  ceu: "#9dbbe0",
} as const;

/** "#5b3fd0" + 0.3 → "rgba(91, 63, 208, 0.3)" (next/og não lê color-mix). */
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
