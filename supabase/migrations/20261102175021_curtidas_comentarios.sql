-- Curtidas e comentários dos posts (Fase 3). Só participa quem consegue
-- ver o post (a política de posts vale dentro dos exists); bloqueio esconde
-- nos dois sentidos. As curtidas vão alimentar o atributo Estilo: uma por
-- pessoa e nunca no próprio post.

-- ------------------------------------------------------------- curtidas

create table public.curtidas (
  post_id uuid not null references public.posts (id) on delete cascade,
  perfil_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, perfil_id)
);

create index on public.curtidas (perfil_id, criado_em);

alter table public.curtidas enable row level security;

create policy "curtidas: leitura" on public.curtidas
  for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id)
    and not private.bloqueio_entre((select auth.uid()), perfil_id)
  );
create policy "curtidas: curte post visível de outra pessoa" on public.curtidas
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
       where p.id = post_id and p.dono_id <> (select auth.uid())
    )
  );
create policy "curtidas: descurte" on public.curtidas
  for delete to authenticated
  using (perfil_id = (select auth.uid()));
revoke update on public.curtidas from anon, authenticated;

-- ---------------------------------------------------------- comentários

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  autor_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 500),
  criado_em timestamptz not null default now()
);

create index on public.comentarios (post_id, criado_em);
create index on public.comentarios (autor_id, criado_em);

alter table public.comentarios enable row level security;

create policy "comentarios: leitura" on public.comentarios
  for select to authenticated
  using (
    exists (select 1 from public.posts p where p.id = post_id)
    and not private.bloqueio_entre((select auth.uid()), autor_id)
  );
create policy "comentarios: comenta em post visível" on public.comentarios
  for insert to authenticated
  with check (
    autor_id = (select auth.uid())
    and exists (select 1 from public.posts p where p.id = post_id)
  );
-- Apaga quem escreveu, ou o dono do post (moderação no próprio post).
create policy "comentarios: autor ou dono do post apaga" on public.comentarios
  for delete to authenticated
  using (
    autor_id = (select auth.uid())
    or exists (
      select 1 from public.posts p
       where p.id = post_id and p.dono_id = (select auth.uid())
    )
  );
revoke update on public.comentarios from anon, authenticated;

-- ---------------------------------------------- limites contra robôs

create function private.limitar_interacoes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total integer;
begin
  if tg_table_name = 'curtidas' then
    select count(*) into v_total from public.curtidas
     where perfil_id = new.perfil_id and criado_em > now() - interval '24 hours';
    if v_total >= 300 then
      raise exception 'Limite diário de curtidas atingido.' using errcode = '23514';
    end if;
  else
    select count(*) into v_total from public.comentarios
     where autor_id = new.autor_id and criado_em > now() - interval '24 hours';
    if v_total >= 50 then
      raise exception 'Limite diário de comentários atingido.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger curtidas_limite
  before insert on public.curtidas
  for each row execute function private.limitar_interacoes();
create trigger comentarios_limite
  before insert on public.comentarios
  for each row execute function private.limitar_interacoes();

-- ----------------------------------------------------------- denúncias

alter type public.alvo_denuncia add value 'comentario';
