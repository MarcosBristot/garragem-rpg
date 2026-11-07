// Logo LifeInGears (enviado pelo dono do produto), traçado em retângulos a
// partir das imagens originais: nítido em qualquer tamanho e na cor do texto
// (currentColor). Sem ids internos (pode haver várias cópias na página).
// Os desenhos também servem às imagens geradas (src/lib/og).

export const DESENHO_LOGO = {
  horizontal: {
    w: 1704,
    h: 214,
    d: "M235 0h129v47h-129zM235 47h53v1h-53zM235 48h52v9h-52zM235 57h53v1h-53zM235 58h52v2h-52zM1430 53h47v13h-47zM1492 53h61v13h-61zM565 25h108v45h-108zM910 25h171v48h-171zM686 62h53v12h-53zM1276 53h142v34h-142zM151 39h49v49h-49zM1093 53h156v36h-156zM152 88h48v1h-48zM1565 53h139v39h-139zM1565 92h138v1h-138zM1430 66h123v29h-123zM1507 95h46v1h-46zM1372 87h46v13h-46zM152 102h48v1h-48zM1093 89h47v17h-47zM1203 89h46v17h-46zM1508 96h45v11h-45zM1565 93h46v15h-46zM214 60h150v49h-150zM378 74h173v38h-173zM686 74h196v46h-196zM830 120h52v1h-52zM235 109h52v16h-52zM994 91h87v38h-87zM378 112h50v18h-50zM501 112h50v18h-50zM1262 100h156v35h-156zM1093 106h156v33h-156zM1565 108h139v38h-139zM1566 146h138v1h-138zM0 25h56v124h-56zM0 149h137v1h-137zM378 130h173v22h-173zM910 73h50v80h-50zM1032 129h49v24h-49zM592 70h53v86h-53zM1658 147h46v14h-46zM1657 161h47v1h-47zM1262 135h46v28h-46zM1372 135h46v28h-46zM1093 139h47v24h-47zM378 152h50v14h-50zM1430 95h47v106h-47zM151 103h49v98h-49zM686 120h53v81h-53zM829 121h53v80h-53zM235 125h53v76h-53zM0 150h138v51h-138zM910 153h171v48h-171zM565 156h108v45h-108zM1565 162h139v39h-139zM1093 163h156v38h-156zM1262 163h156v38h-156zM378 166h173v35h-173zM1372 201h46v13h-46z",
  },
  empilhado: {
    w: 1286,
    h: 627,
    d: "M0 35h81v1h-81zM220 55h71v1h-71zM342 0h188v68h-188zM342 68h77v19h-77zM823 35h157v66h-157zM1000 90h77v17h-77zM220 56h72v72h-72zM220 148h71v1h-71zM312 87h218v71h-218zM550 107h253v56h-253zM1000 107h286v67h-286zM550 163h73v25h-73zM730 163h73v25h-73zM0 36h82v181h-82zM550 188h253v33h-253zM863 101h77v126h-77zM550 221h73v20h-73zM220 149h72v143h-72zM342 158h77v134h-77zM1000 174h77v119h-77zM1209 174h77v119h-77zM0 217h200v76h-200zM823 227h157v66h-157zM550 241h253v52h-253zM220 292h71v1h-71zM342 292h76v1h-76zM843 367h76v21h-76zM943 367h99v21h-99zM0 321h277v79h-277zM593 367h230v54h-230zM297 367h253v58h-253zM1062 367h224v64h-224zM843 388h199v47h-199zM968 435h74v1h-74zM749 421h74v22h-74zM297 425h76v28h-76zM474 425h76v28h-76zM969 436h73v18h-73zM1062 431h74v24h-74zM136 428h141v62h-141zM570 443h253v57h-253zM297 453h253v52h-253zM1062 455h224v63h-224zM0 400h82v128h-82zM199 490h78v38h-78zM1212 518h74v24h-74zM1211 542h75v1h-75zM570 500h74v45h-74zM749 500h74v45h-74zM297 505h76v40h-76zM843 435h76v172h-76zM0 528h277v79h-277zM1062 543h224v64h-224zM297 545h253v62h-253zM570 545h253v62h-253zM749 607h74v20h-74z",
  },
} as const;

type Props = { className?: string; rotulo?: string };

function Svg({
  desenho,
  className = "",
  rotulo,
}: Props & { desenho: { w: number; h: number; d: string } }) {
  return (
    <svg
      viewBox={`0 0 ${desenho.w} ${desenho.h}`}
      className={className}
      fill="currentColor"
      {...(rotulo
        ? { role: "img", "aria-label": rotulo }
        : { "aria-hidden": true })}
    >
      <path d={desenho.d} />
    </svg>
  );
}

/** "LifeInGears" numa linha (cabeçalhos). */
export function LogoHorizontal(props: Props) {
  return <Svg desenho={DESENHO_LOGO.horizontal} {...props} />;
}

/** "LifeIn / Gears" em duas linhas (abertura, cards). */
export function LogoEmpilhado(props: Props) {
  return <Svg desenho={DESENHO_LOGO.empilhado} {...props} />;
}
