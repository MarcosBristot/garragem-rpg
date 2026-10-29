import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // O dev server registra os argumentos de cada Server Action no terminal
  // e em .next/dev/logs. Notas podem ter CPF/endereço: nunca em logs (LGPD).
  logging: { serverFunctions: false },
  // Fotos chegam já reduzidas pelo navegador (~0,5–2 MB); 5 MB dá folga
  // para o multipart sem abrir espaço para abuso (o padrão é 1 MB).
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
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
