import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { URL_WORKER_MAPA, VERSAO_MAPLIBRE } from "./mapa";

describe("worker do mapa", () => {
  it("a cópia em public/ é da mesma versão do maplibre-gl instalado", () => {
    const pacote = JSON.parse(
      readFileSync(
        join(process.cwd(), "node_modules", "maplibre-gl", "package.json"),
        "utf8",
      ),
    );
    expect(pacote.version).toBe(VERSAO_MAPLIBRE);
    const arquivo = join(process.cwd(), "public", URL_WORKER_MAPA);
    expect(existsSync(arquivo)).toBe(true);
    // Mesmo conteúdo do pacote (atualizou o pacote? copie o worker de novo).
    expect(readFileSync(arquivo, "utf8")).toBe(
      readFileSync(
        join(
          process.cwd(),
          "node_modules",
          "maplibre-gl",
          "dist",
          "maplibre-gl-worker.mjs",
        ),
        "utf8",
      ),
    );
  });
});
