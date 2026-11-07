-- Notificações: curtidas e comentários nos seus posts e novos seguidores.
-- Sem tabela nova: são derivadas do que já existe. As funções rodam com as
-- permissões de quem chama (security invoker): a RLS de cada tabela vale,
-- inclusive bloqueios (quem bloqueou ou foi bloqueado não aparece).
-- Só guardamos até quando a pessoa já viu, para contar as novas.

alter table public.perfis
  add column notificacoes_vistas_em timestamptz not null default now();
grant update (notificacoes_vistas_em) on public.perfis to authenticated;

create function public.minhas_notificacoes(p_limite integer default 40)
returns table (
  tipo text,
  ator_id uuid,
  post_id uuid,
  trecho text,
  criado_em timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select n.tipo, n.ator_id, n.post_id, n.trecho, n.criado_em
  from (
    select 'curtida'::text as tipo, c.perfil_id as ator_id, c.post_id,
           null::text as trecho, c.criado_em
      from public.curtidas c
      join public.posts p on p.id = c.post_id
     where p.dono_id = (select auth.uid())
       and c.perfil_id <> (select auth.uid())
    union all
    select 'comentario', c.autor_id, c.post_id, left(c.texto, 120), c.criado_em
      from public.comentarios c
      join public.posts p on p.id = c.post_id
     where p.dono_id = (select auth.uid())
       and c.autor_id <> (select auth.uid())
    union all
    select 'seguidor', s.seguidor_id, null, null, s.criado_em
      from public.seguidores s
     where s.seguido_id = (select auth.uid())
  ) n
  order by n.criado_em desc
  limit least(greatest(coalesce(p_limite, 40), 1), 100);
$$;

-- Quantas chegaram depois da última visita (a bolinha do sino).
create function public.notificacoes_novas()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)::integer
    from public.minhas_notificacoes(100) n
   where n.criado_em > (
     select p.notificacoes_vistas_em from public.perfis p
      where p.id = (select auth.uid())
   );
$$;

-- Marca tudo como visto, com o relógio do servidor.
create function public.marcar_notificacoes_vistas()
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.perfis set notificacoes_vistas_em = now()
   where id = (select auth.uid());
$$;

revoke execute on function public.minhas_notificacoes(integer) from public, anon;
revoke execute on function public.notificacoes_novas() from public, anon;
revoke execute on function public.marcar_notificacoes_vistas() from public, anon;
grant execute on function public.minhas_notificacoes(integer) to authenticated;
grant execute on function public.notificacoes_novas() to authenticated;
grant execute on function public.marcar_notificacoes_vistas() to authenticated;
