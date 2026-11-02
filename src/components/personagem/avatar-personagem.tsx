import { coresDoPersonagem, type Personagem } from "@/dominio/personagem";

// Versão 2D (rosto e ombros, "pixelado") do mesmo personagem: leve, sem
// JavaScript, serve no feed, no menu e enquanto o 3D carrega.
// Sem ids internos no SVG (há várias cópias na mesma página).

const ESCURO = "#15161A";
const GRAFITE = "#2B2D33";

export function AvatarPersonagem({
  personagem,
  rotulo,
  className = "",
}: {
  personagem: Personagem;
  /** Texto para leitores de tela; sem ele o avatar é decorativo. */
  rotulo?: string;
  className?: string;
}) {
  const c = coresDoPersonagem(personagem);
  const { cabelo, acessorio, roupa } = personagem;
  const capacete = acessorio === "capacete";

  return (
    <svg
      viewBox="0 0 20 20"
      shapeRendering="crispEdges"
      className={className}
      {...(rotulo
        ? { role: "img", "aria-label": rotulo }
        : { "aria-hidden": true })}
    >
      {/* Ombros e roupa */}
      <rect x="3" y="15" width="14" height="5" fill={c.roupa} />
      {roupa === "jaqueta" ? (
        <rect x="9.5" y="15" width="1" height="5" fill={GRAFITE} />
      ) : null}
      {roupa === "macacao" ? (
        <rect x="11" y="16.5" width="3" height="2" fill={GRAFITE} />
      ) : null}
      {/* Pescoço, cabeça e rosto */}
      <rect x="8" y="13" width="4" height="2" fill={c.pele} />
      <rect x="8" y="13" width="4" height="1" fill="#000" opacity="0.15" />
      <rect x="5" y="3" width="10" height="10" fill={c.pele} />
      <rect x="7" y="8" width="1.5" height="2" fill={ESCURO} />
      <rect x="11.5" y="8" width="1.5" height="2" fill={ESCURO} />
      <rect x="8.5" y="11" width="3" height="0.8" fill="#000" opacity="0.35" />

      {/* Cabelo (o capacete cobre) */}
      {capacete ? null : cabelo === "raspado" ? (
        <rect
          x="5"
          y="3"
          width="10"
          height="1"
          fill={c.cabelo}
          opacity="0.85"
        />
      ) : (
        <>
          <rect x="5" y="2.5" width="10" height="2.5" fill={c.cabelo} />
          {cabelo === "longo" ? (
            <>
              <rect x="4" y="3" width="1.5" height="12" fill={c.cabelo} />
              <rect x="14.5" y="3" width="1.5" height="12" fill={c.cabelo} />
            </>
          ) : (
            <>
              <rect x="5" y="5" width="1" height="2" fill={c.cabelo} />
              <rect x="14" y="5" width="1" height="2" fill={c.cabelo} />
            </>
          )}
          {cabelo === "topete" ? (
            <rect x="7" y="1.5" width="7" height="1.5" fill={c.cabelo} />
          ) : null}
          {cabelo === "coque" ? (
            <rect x="8" y="0.5" width="4" height="2.5" fill={c.cabelo} />
          ) : null}
        </>
      )}

      {/* Acessório */}
      {acessorio === "bone" ? (
        <>
          <rect x="4.5" y="1.5" width="11" height="3" fill={c.roupa} />
          <rect x="4.5" y="4.5" width="12.5" height="1" fill={c.roupa} />
          <rect
            x="4.5"
            y="4.5"
            width="12.5"
            height="1"
            fill="#000"
            opacity="0.25"
          />
        </>
      ) : null}
      {capacete ? (
        <>
          <rect x="3.5" y="1.5" width="13" height="12" fill={c.roupa} />
          <rect x="5.5" y="6.5" width="9" height="3.5" fill={ESCURO} />
          <rect x="6" y="7" width="3" height="1" fill="#fff" opacity="0.25" />
        </>
      ) : null}
      {acessorio === "oculos" ? (
        <rect x="5.5" y="7.5" width="9" height="2.5" fill={ESCURO} />
      ) : null}
      {acessorio === "fone" ? (
        <>
          <rect x="4" y="1.5" width="12" height="1" fill={GRAFITE} />
          <rect x="3" y="7" width="2" height="4" fill={c.roupa} />
          <rect x="15" y="7" width="2" height="4" fill={c.roupa} />
        </>
      ) : null}
    </svg>
  );
}
