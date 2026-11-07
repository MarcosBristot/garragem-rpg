-- Limite contra robôs também no "seguir": com notificações, seguir em massa
-- viraria spam no sino de todo mundo. Mesma janela das curtidas e
-- comentários (últimas 24 h).

create function private.limitar_seguir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.seguidores
       where seguidor_id = new.seguidor_id
         and criado_em > now() - interval '24 hours') >= 150 then
    raise exception 'Limite diário de novos seguidos atingido.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger seguidores_limite
  before insert on public.seguidores
  for each row execute function private.limitar_seguir();
