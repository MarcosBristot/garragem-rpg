import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // O dev server registra os argumentos de cada Server Action no terminal
  // e em .next/dev/logs. Notas podem ter CPF/endereço: nunca em logs (LGPD).
  logging: { serverFunctions: false },
  // Fotos chegam já reduzidas pelo navegador (~0,5–2 MB); o padrão (1 MB)
  // não bastaria. 4,5 MB é o teto da Vercel por requisição: acima disso
  // ela devolve 413 antes do app (ver src/lib/fotos/limites.ts).
  experimental: { serverActions: { bodySizeLimit: "4.5mb" } },
  // Cabeçalhos de segurança em todas as páginas.
  headers() {
    return [
      {
        source: "/:caminho*",
        headers: [
          // Regra 1 do projeto: o site nunca pede localização, câmera ou mic.
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=(), payment=()",
          },
          // Impede embutir o site em outro (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Ambiente de teste (e qualquer deploy sem PERMITIR_INDEXACAO=true)
          // fica fora do Google: páginas legais ainda são rascunho.
          ...(process.env.PERMITIR_INDEXACAO === "true"
            ? []
            : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
