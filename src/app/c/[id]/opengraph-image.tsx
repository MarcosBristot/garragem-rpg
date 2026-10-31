import { ImageResponse } from "next/og";
import { nomeDoCarro } from "@/lib/carros";
import { fontesOg } from "@/lib/og/fontes";
import { fotoParaImagem } from "@/lib/og/foto";
import { carroPublico } from "@/lib/publico";

// Imagem de prévia quando o link do carro é compartilhado (WhatsApp,
// Instagram, X...). Só usa dados públicos: carro público e a capa.

export const alt = "Carro no Garagem RPG";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagem({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const dados = await carroPublico(id);
  const fontes = await fontesOg();

  const nome = dados ? nomeDoCarro(dados.carro) : "Garagem RPG";
  const detalhe = dados
    ? [dados.carro.marca, dados.carro.modelo, dados.carro.ano]
        .filter(Boolean)
        .join(" · ")
    : "O diário do seu carro";
  const capa = dados?.carro.foto_capa
    ? await fotoParaImagem(dados.carro.foto_capa, 640, 630)
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0b0b0d",
        color: "#ecedef",
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          width: 560,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 6,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: "#f5a524",
              transform: "rotate(45deg)",
            }}
          />
          GARAGEM RPG
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 4,
              color: "#a3a7b0",
              textTransform: "uppercase",
            }}
          >
            {detalhe}
          </div>
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontSize: 104,
              lineHeight: 1,
            }}
          >
            {nome}
          </div>
          {dados ? (
            <div style={{ fontSize: 28, color: "#f5a524" }}>
              {`@${dados.dono.nome_usuario}`}
            </div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(245,165,36,0.35), #0b0b0d 70%)",
        }}
      >
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capa}
            alt=""
            width={640}
            height={630}
            style={{ width: 640, height: 630, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              fontFamily: "Instrument Serif",
              fontSize: 64,
              color: "#f5a524",
            }}
          >
            ◆
          </div>
        )}
      </div>
    </div>,
    { ...size, fonts: fontes },
  );
}
