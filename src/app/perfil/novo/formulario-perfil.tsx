"use client";

import { useActionState } from "react";
import { Botao, Campo } from "@/components/formulario";
import { criarPerfil, type EstadoPerfil } from "./acoes";

const inicial: EstadoPerfil = {
  valores: { nome_usuario: "", nome_exibicao: "", cidade: "" },
  erros: {},
};

export function FormularioPerfil() {
  const [estado, acao, enviando] = useActionState(criarPerfil, inicial);

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      <Campo
        id="nome_usuario"
        name="nome_usuario"
        defaultValue={estado.valores.nome_usuario}
        rotulo="Nome de usuário"
        autoComplete="username"
        autoCapitalize="none"
        required
        maxLength={30}
        erro={estado.erros.nomeUsuario}
        dica="Aparece no link do seu perfil. Letras minúsculas, números e _."
      />
      <Campo
        id="nome_exibicao"
        name="nome_exibicao"
        defaultValue={estado.valores.nome_exibicao}
        rotulo="Nome de exibição (opcional)"
        autoComplete="nickname"
        maxLength={60}
        erro={estado.erros.nomeExibicao}
      />
      <Campo
        id="cidade"
        name="cidade"
        defaultValue={estado.valores.cidade}
        rotulo="Cidade (opcional)"
        autoComplete="off"
        maxLength={80}
        erro={estado.erros.cidade}
        dica="Só a cidade. Nunca mostramos onde o carro fica."
      />
      {estado.erroGeral ? (
        <p role="alert" className="text-sm text-red-300">
          {estado.erroGeral}
        </p>
      ) : null}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : "Criar perfil"}
      </Botao>
    </form>
  );
}
