import { Campo } from "@/components/formulario";
import type { ErrosPerfil } from "@/dominio/perfil";

export type ValoresPerfil = Record<
  "nome_usuario" | "nome_exibicao" | "cidade",
  string
>;

/** Campos do perfil, usados na criação e na edição. */
export function CamposPerfil({
  valores,
  erros,
}: {
  valores: ValoresPerfil;
  erros: ErrosPerfil;
}) {
  return (
    <>
      <Campo
        id="nome_usuario"
        name="nome_usuario"
        defaultValue={valores.nome_usuario}
        rotulo="Nome de usuário"
        autoComplete="username"
        autoCapitalize="none"
        required
        maxLength={30}
        erro={erros.nomeUsuario}
        dica="Aparece no link do seu perfil. Letras minúsculas, números e _."
      />
      <Campo
        id="nome_exibicao"
        name="nome_exibicao"
        defaultValue={valores.nome_exibicao}
        rotulo="Nome de exibição (opcional)"
        autoComplete="nickname"
        maxLength={60}
        erro={erros.nomeExibicao}
      />
      <Campo
        id="cidade"
        name="cidade"
        defaultValue={valores.cidade}
        rotulo="Cidade (opcional)"
        autoComplete="off"
        maxLength={80}
        erro={erros.cidade}
        dica="Só a cidade. Nunca mostramos onde o carro fica."
      />
    </>
  );
}
