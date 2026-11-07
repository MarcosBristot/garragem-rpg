import type { Metadata } from "next";
import { Chakra_Petch, Pixelify_Sans } from "next/font/google";
import { AvisoCookies } from "@/components/aviso-cookies";
import { Rodape } from "@/components/rodape";
import "./globals.css";

// next/font baixa as fontes no build e serve do próprio domínio:
// nenhuma requisição ao Google no navegador do usuário.
// Identidade LifeInGears: títulos em Pixelify Sans (grade de pixels, como
// o logo) e texto em Chakra Petch (cantos retos, cara automotiva). As duas
// têm licença OFL (uso comercial livre) e acentos do português.
const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin", "latin-ext"],
});

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LifeInGears",
  description:
    "O diário de manutenção do seu carro que vira ficha de RPG. Registre, evolua e compartilhe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      // Rolagem suave só dentro da página (âncoras); na troca de página o
      // Next pula direto para o topo, sem "deslizar" o conteúdo novo.
      data-scroll-behavior="smooth"
      className={`${pixelify.variable} ${chakra.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Primeiro item do Tab: pula o menu direto para o conteúdo. */}
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-lg border-2 border-texto bg-destaque sombra-botao px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Pular para o conteúdo
        </a>
        {children}
        <Rodape />
        <AvisoCookies />
      </body>
    </html>
  );
}
