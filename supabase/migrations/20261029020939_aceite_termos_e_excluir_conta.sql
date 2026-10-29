-- LGPD: registro do aceite dos termos e exclusão da conta pelo titular.

-- Quando e qual versão dos Termos/Política a pessoa aceitou (prova do
-- aceite). Nulo só em perfis antigos, criados antes desta migração.
alter table public.perfis
  add column termos_aceitos_em timestamptz,
  add column versao_termos text check (char_length(versao_termos) <= 20);

-- Perfil novo só entra com aceite registrado: a regra fica no banco,
-- não só no formulário.
drop policy "perfis: cria o próprio" on public.perfis;
create policy "perfis: cria o próprio com aceite" on public.perfis
  for insert to authenticated
  with check (
    id = (select auth.uid())
    and termos_aceitos_em is not null
    and versao_termos is not null
  );

-- O aceite não pode ser apagado nem reescrito pelo usuário depois.
-- Revogar só as colunas não bastaria: permissão na tabela inteira vence.
-- Então: tira o UPDATE da tabela e devolve só nas colunas editáveis.
revoke update on public.perfis from anon, authenticated;
grant update (nome_usuario, nome_exibicao, cidade) on public.perfis
  to authenticated;

-- Direito de eliminação (LGPD art. 18, VI): apaga o usuário de
-- auth.users; perfil, carros, registros, itens e histórico vão em cascata.
-- security definer porque o usuário não tem permissão em auth.users;
-- o where com auth.uid() garante que só a própria conta é apagada.
create function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
