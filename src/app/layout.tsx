import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

// next/font baixa as fontes no build e serve do próprio domínio:
// nenhuma requisição ao Google no navegador do usuário.
// Geist e Instrument Serif têm licença OFL (uso comercial livre).
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Garagem RPG",
  description:
    "O diário de manutenção do seu carro que vira ficha de RPG. Registre, evolua e compartilhe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Primeiro item do Tab: pula o menu direto para o conteúdo. */}
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-lg bg-destaque px-4 py-3 font-semibold text-fundo focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
