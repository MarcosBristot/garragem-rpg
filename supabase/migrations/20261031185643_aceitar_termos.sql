-- Novo aceite quando os Termos/Política mudam. O usuário não pode
-- escrever nas colunas do aceite (UPDATE só em nome, exibição e cidade);
-- esta função é o único caminho, e sempre grava a data de agora.
create function public.aceitar_termos(p_versao text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;
  if p_versao is null or char_length(p_versao) not between 1 and 20 then
    raise exception 'versão inválida' using errcode = '22023';
  end if;
  update public.perfis
     set termos_aceitos_em = now(), versao_termos = p_versao
   where id = auth.uid();
end;
$$;

revoke execute on function public.aceitar_termos(text) from public, anon;
grant execute on function public.aceitar_termos(text) to authenticated;
