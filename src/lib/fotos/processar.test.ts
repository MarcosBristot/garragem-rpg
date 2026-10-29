import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

// "server-only" só existe dentro do Next; no teste, vira um módulo vazio.
vi.mock("server-only", () => ({}));
const { processarFoto, TAMANHOS } = await import("./processar");

/** Foto fictícia 3000x2000 com EXIF de câmera e GPS, como a de um celular. */
async function fotoComGps(orientacao?: number) {
  let img = sharp({
    create: { width: 3000, height: 2000, channels: 3, background: "#d9821a" },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: "CameraFicticia", Copyright: "Pessoa Ficticia" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "23/1 33/1 0/1",
        GPSLongitudeRef: "W",
        GPSLongitude: "46/1 38/1 0/1",
      },
    });
  if (orientacao) img = img.withMetadata({ orientation: orientacao });
  return img.toBuffer();
}

describe("processarFoto", () => {
  it("a foto de teste realmente tem EXIF com GPS (o teste vale algo)", async () => {
    const meta = await sharp(await fotoComGps()).metadata();
    expect(meta.exif).toBeDefined();
    expect(meta.exif!.toString("latin1")).toContain("CameraFicticia");
  });

  it("remove EXIF, GPS, XMP e IPTC de todos os tamanhos (regra 1)", async () => {
    const { arquivos } = await processarFoto(await fotoComGps());
    for (const arquivo of Object.values(arquivos)) {
      const meta = await sharp(arquivo).metadata();
      expect(meta.exif).toBeUndefined();
      expect(meta.xmp).toBeUndefined();
      expect(meta.iptc).toBeUndefined();
      expect(arquivo.toString("latin1")).not.toContain("CameraFicticia");
    }
  });

  it("gera os três tamanhos em WebP sem passar do limite", async () => {
    const { arquivos, largura, altura } = await processarFoto(
      await fotoComGps(),
    );
    expect([largura, altura]).toEqual([2048, 1365]);
    for (const [nome, limite] of Object.entries(TAMANHOS)) {
      const meta = await sharp(
        arquivos[nome as keyof typeof TAMANHOS],
      ).metadata();
      expect(meta.format).toBe("webp");
      expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(limite);
    }
  });

  it("aplica a orientação do EXIF antes de apagá-lo (foto não fica deitada)", async () => {
    // orientação 6 = câmera girada 90°: a foto em pé tem altura > largura.
    const { largura, altura } = await processarFoto(await fotoComGps(6));
    expect(altura).toBeGreaterThan(largura);
  });

  it("não aumenta foto pequena", async () => {
    const pequena = await sharp({
      create: { width: 200, height: 100, channels: 3, background: "#000" },
    })
      .png()
      .toBuffer();
    const { largura, altura } = await processarFoto(pequena);
    expect([largura, altura]).toEqual([200, 100]);
  });

  it("recusa arquivo que não é imagem", async () => {
    await expect(
      processarFoto(Buffer.from("não sou uma foto")),
    ).rejects.toThrow();
  });
});
