import { FotoAssinada } from "@/components/foto-assinada";
import { AvatarPersonagem } from "@/components/personagem/avatar-personagem";
import { personagemDoPerfil } from "@/dominio/personagem";

// Avatar de uma pessoa: a foto de perfil, quando há; senão, o rosto do
// personagem (o boneco é um extra, não o principal). Sempre redondo.

export function AvatarPerfil({
  perfil,
  rotulo,
  tamanho,
  className = "",
}: {
  perfil: { id: string; personagem: unknown; foto?: string | null };
  /** Texto para leitores de tela; sem ele o avatar é decorativo. */
  rotulo?: string;
  /** Largura exibida, para o navegador escolher o tamanho do arquivo. */
  tamanho: string;
  className?: string;
}) {
  if (perfil.foto) {
    return (
      <FotoAssinada
        chave={perfil.foto}
        alt={rotulo ?? ""}
        sizes={tamanho}
        className={`rounded-md bg-superficie-2 object-cover ${className}`}
      />
    );
  }
  return (
    <AvatarPersonagem
      personagem={personagemDoPerfil(perfil.personagem, perfil.id)}
      rotulo={rotulo}
      className={`rounded-md bg-superficie-2 ${className}`}
    />
  );
}
