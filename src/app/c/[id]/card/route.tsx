import { ImageResponse } from "next/og";
import { TIPOS } from "@/dominio/registro";
import { nomeDoCarro } from "@/lib/carros";
import { formatarData } from "@/lib/datas";
import { fontesOg } from "@/lib/og/fontes";
import { fotoParaImagem } from "@/lib/og/foto";
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
        background: "#0b0b0d",
        color: "#ecedef",
        fontFamily: "Geist",
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
        <div
          style={{
            width: 22,
            height: 22,
            background: "#f5a524",
            transform: "rotate(45deg)",
          }}
        />
        GARAGEM RPG
      </div>

      <div
        style={{
          width: 1080,
          height: 1080,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(245,165,36,0.35), #0b0b0d 70%)",
        }}
      >
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa} alt="" width={1080} height={1080} />
        ) : (
          <div style={{ fontSize: 200, color: "#f5a524" }}>◆</div>
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
            color: "#a3a7b0",
            textTransform: "uppercase",
          }}
        >
          {detalhe}
        </div>
        <div
          style={{
            fontFamily: "Instrument Serif",
            fontSize: 150,
            lineHeight: 1,
          }}
        >
          {nome}
        </div>
        <div style={{ fontSize: 40, color: "#f5a524" }}>
          {`@${dono.nome_usuario}`}
        </div>
        <div style={{ fontSize: 34, color: "#a3a7b0", marginTop: 20 }}>
          {`${diario.length} ${diario.length === 1 ? "registro público" : "registros públicos"} no diário`}
        </div>
        {ultimo?.titulo && ultimo.data ? (
          <div style={{ fontSize: 34, color: "#a3a7b0" }}>
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
    `attachment; filename="garagem-rpg-${carro.id.slice(0, 8)}-stories.png"`,
  );
  imagem.headers.set("Cache-Control", "no-store");
  return imagem;
}
