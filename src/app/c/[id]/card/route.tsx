import { ImageResponse } from "next/og";
import { TIPOS } from "@/dominio/registro";
import { DESENHO_LOGO } from "@/components/logo";
import { nomeDoCarro } from "@/lib/carros";
import { formatarData } from "@/lib/datas";
import { fontesOg } from "@/lib/og/fontes";
import { fotoParaImagem } from "@/lib/og/foto";
import { comAlfa, PALETA } from "@/lib/paleta";
import { carroPublico, diarioPublico } from "@/lib/publico";

// Card 9:16 (1080x1920) para stories, só com dados públicos (cliente
// anônimo). Mostra o que existe de verdade: nada de atributos inventados.

export async function GET(
  _requisicao: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const dados = await carroPublico(id);
  if (!dados) return new Response("Não encontrado", { status: 404 });

  const { carro, dono } = dados;
  const [diario, fontes, capa] = await Promise.all([
    diarioPublico(carro.id),
    fontesOg(),
    carro.foto_capa ? fotoParaImagem(carro.foto_capa, 1080, 1080) : null,
  ]);
  const ultimo = diario[0];
  const nome = nomeDoCarro(carro);
  const detalhe = [carro.marca, carro.modelo, carro.ano]
    .filter(Boolean)
    .join(" · ");

  const imagem = new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PALETA.fundo,
        color: PALETA.texto,
        fontFamily: "Barlow",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "80px 80px 50px",
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: 8,
        }}
      >
        <Logo desenho={DESENHO_LOGO.horizontal} largura={360} />
      </div>

      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: comAlfa(PALETA.destaque, 0.1),
        }}
      >
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa} alt="" width={1080} height={1080} />
        ) : (
          <Logo desenho={DESENHO_LOGO.empilhado} largura={700} />
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 6,
            color: PALETA.textoSecundario,
            textTransform: "uppercase",
          }}
        >
          {detalhe}
        </div>
        <div
          style={{
            fontFamily: "Barlow Semi Condensed",
            fontSize: 150,
            lineHeight: 1,
          }}
        >
          {nome}
        </div>
        <div style={{ fontSize: 40, color: PALETA.destaque }}>
          {`@${dono.nome_usuario}`}
        </div>
        <div
          style={{ fontSize: 34, color: PALETA.textoSecundario, marginTop: 20 }}
        >
          {`${diario.length} ${diario.length === 1 ? "registro público" : "registros públicos"} no diário`}
        </div>
        {ultimo?.titulo && ultimo.data ? (
          <div style={{ fontSize: 34, color: PALETA.textoSecundario }}>
            {`Último: ${ultimo.titulo} · ${formatarData(ultimo.data)}${ultimo.tipo ? ` · ${TIPOS[ultimo.tipo]}` : ""}`}
          </div>
        ) : null}
      </div>
    </div>,
    { width: 1080, height: 1920, fonts: fontes },
  );

  // Download com nome amigável. Sem cache: se o dono tornar o carro
  // privado, nenhum CDN pode continuar servindo o card.
  imagem.headers.set(
    "Content-Disposition",
    `attachment; filename="lifeingears-${carro.id.slice(0, 8)}-stories.png"`,
  );
  imagem.headers.set("Cache-Control", "no-store");
  return imagem;
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
