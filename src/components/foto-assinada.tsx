import { urlsDaFoto } from "@/lib/fotos/armazenamento";

// Mostra uma foto privada com URLs assinadas (válidas por 1 h) e srcset dos
// três tamanhos. Só use dentro de páginas que já conferiram a permissão.
// <img> em vez de next/image: os tamanhos já são gerados no upload e a URL
// assinada muda a cada visita, então o otimizador do Next não ajudaria.
export async function FotoAssinada({
  chave,
  alt,
  sizes,
  className = "",
  prioridade = false,
}: {
  chave: string;
  alt: string;
  sizes: string;
  className?: string;
  prioridade?: boolean;
}) {
  const url = await urlsDaFoto(chave);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url.feed}
      srcSet={`${url.mini} 320w, ${url.feed} 1080w, ${url.cheia} 2048w`}
      sizes={sizes}
      alt={alt}
      loading={prioridade ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
