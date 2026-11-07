import { ImageResponse } from "next/og";
import { DESENHO_LOGO } from "@/components/logo";
import { nomeDoCarro } from "@/lib/carros";
import { fontesOg } from "@/lib/og/fontes";
import { fotoParaImagem } from "@/lib/og/foto";
import { comAlfa, PALETA } from "@/lib/paleta";
import { carroPublico } from "@/lib/publico";

// Imagem de prévia quando o link do carro é compartilhado (WhatsApp,
// Instagram, X...). Só usa dados públicos: carro público e a capa.

export const alt = "Carro no LifeInGears";
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

  const nome = dados ? nomeDoCarro(dados.carro) : "LifeInGears";
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
        background: PALETA.fundo,
        color: PALETA.texto,
        fontFamily: "Chakra Petch",
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
          <Logo desenho={DESENHO_LOGO.horizontal} largura={240} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 4,
              color: PALETA.textoSecundario,
              textTransform: "uppercase",
            }}
          >
            {detalhe}
          </div>
          <div
            style={{
              fontFamily: "Pixelify Sans",
              fontSize: 104,
              lineHeight: 1,
            }}
          >
            {nome}
          </div>
          {dados ? (
            <div style={{ fontSize: 28, color: PALETA.destaque }}>
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
          background: comAlfa(PALETA.destaque, 0.1),
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
          <Logo desenho={DESENHO_LOGO.empilhado} largura={360} />
        )}
      </div>
    </div>,
    { ...size, fonts: fontes },
  );
}

/** Logo em SVG dentro da imagem gerada (o satori desenha <svg> direto). */
function Logo({
  desenho,
  largura,
}: {
  desenho: { w: number; h: number; d: string };
  largura: number;
}) {
  return (
    <svg
      width={largura}
      height={Math.round((largura * desenho.h) / desenho.w)}
      viewBox={`0 0 ${desenho.w} ${desenho.h}`}
    >
      <path d={desenho.d} fill={PALETA.destaque} />
    </svg>
  );
}
