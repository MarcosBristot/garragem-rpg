import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AvatarPerfil } from "@/components/avatar-perfil";
import { EnviarFoto } from "@/components/enviar-foto";
import { Botao } from "@/components/formulario";
import { AvatarPersonagem } from "@/components/personagem/avatar-personagem";
import { personagemDoPerfil } from "@/dominio/personagem";
import { exigirPerfil } from "@/lib/sessao";
import { desbloquear } from "../../pessoas-acoes";
import { sair } from "../acoes";
import { EditarPerfil } from "../editar-perfil";
import { enviarFotoPerfil, removerFotoPerfil } from "../foto-acoes";
import { ExcluirConta } from "../excluir-conta";

export const metadata: Metadata = {
  title: "Configurações · Garagem RPG",
};

export default function PaginaConfiguracoes() {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-10"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/conta"
          className="inline-flex min-h-11 items-center self-start text-sm text-texto-secundario hover:text-texto"
        >
          ← Seu perfil
        </Link>
        <h1 className="text-5xl">Configurações</h1>
      </div>
      <Suspense fallback={<p className="text-texto-secundario">Carregando…</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  // Conta continua acessível sem o novo aceite (baixar dados, excluir).
  const { supabase, perfil } = await exigirPerfil({ aceiteOpcional: true });
  const { data } = await supabase
    .from("perfis")
    .select("personagem")
    .eq("id", perfil.id)
    .maybeSingle();
  const personagem = personagemDoPerfil(data?.personagem, perfil.id);
  const { data: bloqueados } = await supabase
    .from("bloqueios")
    .select(
      "bloqueado_id, perfis!bloqueios_bloqueado_id_fkey (nome_usuario, nome_exibicao)",
    )
    .eq("bloqueador_id", perfil.id)
    .order("criado_em", { ascending: false });

  return (
    <>
      <section
        aria-labelledby="titulo-perfil"
        className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-6"
      >
        <h2 id="titulo-perfil" className="rotulo font-sans">
          Seu perfil
        </h2>
        <EditarPerfil
          valores={{
            nome_usuario: perfil.nome_usuario,
            nome_exibicao: perfil.nome_exibicao ?? "",
            cidade: perfil.cidade ?? "",
          }}
        />
      </section>

      <section
        aria-labelledby="titulo-foto"
        className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-6 sm:flex-row sm:items-center sm:gap-6"
      >
        <AvatarPerfil
          perfil={perfil}
          rotulo="Sua foto de perfil"
          tamanho="112px"
          className="size-28 shrink-0"
        />
        <div className="flex flex-col gap-3">
          <h2 id="titulo-foto" className="rotulo font-sans">
            Foto de perfil
          </h2>
          <p className="text-sm text-texto-secundario">
            Aparece no seu perfil, nos seus posts e comentários, para todos. A
            localização (GPS) e outros dados escondidos da foto são removidos
            antes de salvar.
          </p>
          <EnviarFoto
            acao={enviarFotoPerfil}
            rotulo={perfil.foto ? "Trocar foto" : "Escolher foto"}
          />
          {perfil.foto ? (
            <form action={removerFotoPerfil}>
              <Botao type="submit" variante="secundario">
                Remover foto
              </Botao>
            </form>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="titulo-personagem"
        className="flex items-center gap-5 rounded-2xl border border-borda bg-superficie p-6"
      >
        <AvatarPersonagem
          personagem={personagem}
          className="size-20 shrink-0 rounded-2xl bg-superficie-2 p-1"
        />
        <div className="flex flex-col gap-2">
          <h2 id="titulo-personagem" className="rotulo font-sans">
            Personagem (opcional)
          </h2>
          <p className="text-sm text-texto-secundario">
            Um boneco 3D que aparece no seu perfil público. Sem foto, o rosto
            dele vira o seu avatar.
          </p>
          <Link
            href="/conta/personagem"
            className="inline-flex min-h-11 items-center self-start rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
          >
            Editar personagem
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="titulo-bloqueios"
        className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-6"
      >
        <h2 id="titulo-bloqueios" className="rotulo font-sans">
          Pessoas bloqueadas
        </h2>
        {bloqueados && bloqueados.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {bloqueados.map((b) => (
              <li
                key={b.bloqueado_id}
                className="flex items-center justify-between gap-3"
              >
                <span className="truncate">
                  {b.perfis?.nome_exibicao ?? b.perfis?.nome_usuario}{" "}
                  <span className="text-texto-secundario">
                    @{b.perfis?.nome_usuario}
                  </span>
                </span>
                <form action={desbloquear.bind(null, b.bloqueado_id)}>
                  <Botao type="submit" variante="secundario">
                    Desbloquear
                  </Botao>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-texto-secundario">
            Ninguém. Quem você bloquear não vê seus posts, você não vê os dela,
            e a pessoa não é avisada.
          </p>
        )}
      </section>

      <section
        aria-labelledby="titulo-dados"
        className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-6"
      >
        <h2 id="titulo-dados" className="rotulo font-sans">
          Seus dados
        </h2>
        <p className="text-sm text-texto-secundario">
          Baixe uma cópia de tudo o que você registrou (perfil, carros,
          registros, itens, notas e histórico), em formato JSON. Veja a{" "}
          <Link href="/privacidade" className="text-destaque underline">
            Política de Privacidade
          </Link>
          .
        </p>
        {/* Link comum (não <Link>): é um download, não uma página. */}
        <a
          href="/conta/dados"
          download
          className="inline-flex min-h-11 items-center self-start rounded-full border border-borda px-5 text-sm font-semibold hover:bg-borda/50"
        >
          Baixar meus dados
        </a>
      </section>

      <form action={sair}>
        <Botao type="submit" variante="secundario">
          Sair da conta
        </Botao>
      </form>

      <section
        aria-labelledby="titulo-excluir"
        className="flex flex-col gap-3 border-t border-borda pt-8"
      >
        <h2 id="titulo-excluir" className="text-3xl">
          Excluir conta
        </h2>
        <p className="text-sm text-texto-secundario">
          Apaga sua conta e todos os seus dados. Não dá para desfazer.
        </p>
        <ExcluirConta nomeUsuario={perfil.nome_usuario} />
      </section>
    </>
  );
}
