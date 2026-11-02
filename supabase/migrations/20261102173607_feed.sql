-- Feed (Fase 3): posts publicados de propósito, seguir e bloquear.
-- O diário continua privado; o feed só mostra o que a pessoa publicou.
-- Regra 5: bloquear e denunciar nascem junto com o conteúdo de terceiros.

-- ------------------------------------------------------------ bloqueios

create table public.bloqueios (
  bloqueador_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  bloqueado_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);

create index on public.bloqueios (bloqueado_id);

alter table public.bloqueios enable row level security;

-- Só quem bloqueou vê o bloqueio; a pessoa bloqueada não é avisada.
create policy "bloqueios: quem bloqueou gerencia" on public.bloqueios
  for all to authenticated
  using (bloqueador_id = (select auth.uid()))
  with check (bloqueador_id = (select auth.uid()));
revoke update on public.bloqueios from anon, authenticated;

-- Bloqueio vale para os dois lados. Fica no schema private (fora da API):
-- usada pelas políticas, mas ninguém consegue perguntar "fulano me
-- bloqueou?" diretamente.
create function private.bloqueio_entre(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bloqueios
     where (bloqueador_id = a and bloqueado_id = b)
        or (bloqueador_id = b and bloqueado_id = a)
  );
$$;

-- As políticas rodam com o papel de quem consulta: ele precisa "entrar"
-- no schema private. Para isso não abrir as outras funções internas,
-- nenhuma delas fica executável por padrão; só esta é liberada.
revoke execute on all functions in schema private from public;
alter default privileges in schema private revoke execute on functions from public;
grant usage on schema private to authenticated;
grant execute on function private.bloqueio_entre(uuid, uuid) to authenticated;

-- ----------------------------------------------------------- seguidores

create table public.seguidores (
  seguidor_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  seguido_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor_id, seguido_id),
  check (seguidor_id <> seguido_id)
);

create index on public.seguidores (seguido_id);

alter table public.seguidores enable row level security;

-- Cada um vê só as próprias relações (quem segue e quem o segue).
create policy "seguidores: as próprias relações" on public.seguidores
  for select to authenticated
  using (seguidor_id = (select auth.uid()) or seguido_id = (select auth.uid()));
create policy "seguidores: segue em nome próprio, sem bloqueio" on public.seguidores
  for insert to authenticated
  with check (
    seguidor_id = (select auth.uid())
    and not private.bloqueio_entre(seguidor_id, seguido_id)
  );
create policy "seguidores: deixa de seguir" on public.seguidores
  for delete to authenticated
  using (seguidor_id = (select auth.uid()));
revoke update on public.seguidores from anon, authenticated;

-- Bloquear desfaz o "seguir" nos dois sentidos.
create function private.bloqueio_desfaz_seguir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.seguidores
   where (seguidor_id = new.bloqueador_id and seguido_id = new.bloqueado_id)
      or (seguidor_id = new.bloqueado_id and seguido_id = new.bloqueador_id);
  return null;
end;
$$;

create trigger bloqueios_desfaz_seguir
  after insert on public.bloqueios
  for each row execute function private.bloqueio_desfaz_seguir();

-- ---------------------------------------------------------------- posts

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  carro_id uuid not null,
  legenda text check (char_length(legenda) <= 2000),
  criado_em timestamptz not null default now(),
  foreign key (carro_id, dono_id)
    references public.carros (id, dono_id) on delete cascade
);

create index on public.posts (criado_em desc);
create index on public.posts (dono_id, criado_em desc);
create index on public.posts (carro_id);

alter table public.posts enable row level security;

-- Dono: cria (só em carro próprio e público), edita a legenda e apaga.
create policy "posts: dono cria em carro público" on public.posts
  for insert to authenticated
  with check (
    dono_id = (select auth.uid())
    and exists (
      select 1 from public.carros c
       where c.id = carro_id and c.dono_id = (select auth.uid()) and c.publico
    )
  );
create policy "posts: dono edita" on public.posts
  for update to authenticated
  using (dono_id = (select auth.uid()))
  with check (dono_id = (select auth.uid()));
create policy "posts: dono apaga" on public.posts
  for delete to authenticated
  using (dono_id = (select auth.uid()));
revoke update on public.posts from anon, authenticated;
grant update (legenda) on public.posts to authenticated;

-- Quem tem conta vê: os próprios, e os de carros ainda públicos sem
-- bloqueio entre as duas pessoas. Carro voltou a privado? Some do feed.
create policy "posts: leitura" on public.posts
  for select to authenticated
  using (
    dono_id = (select auth.uid())
    or (
      exists (select 1 from public.carros c where c.id = carro_id and c.publico)
      and not private.bloqueio_entre((select auth.uid()), dono_id)
    )
  );

-- Contra spam: até 20 posts por pessoa a cada 24 h.
create function private.limitar_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.posts
       where dono_id = new.dono_id
         and criado_em > now() - interval '24 hours') >= 20 then
    raise exception 'Limite diário de posts atingido.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger posts_limite
  before insert on public.posts
  for each row execute function private.limitar_posts();

-- ------------------------------------------------------- fotos do post

create table public.fotos_post (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  dono_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  -- Arquivo dentro do "diretório" do próprio post (src/lib/fotos/chaves.ts).
  chave text not null unique
    check (chave like 'u/' || dono_id::text || '/c/%/p/' || post_id::text || '/%'),
  descricao text check (char_length(descricao) <= 200),
  largura integer not null check (largura > 0),
  altura integer not null check (altura > 0),
  criado_em timestamptz not null default now()
);

create index on public.fotos_post (post_id, criado_em);

alter table public.fotos_post enable row level security;

create policy "fotos_post: dono do post gerencia" on public.fotos_post
  for all to authenticated
  using (dono_id = (select auth.uid()))
  with check (
    dono_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
       where p.id = post_id and p.dono_id = (select auth.uid())
    )
  );
-- Vê a foto quem vê o post (a política de posts vale dentro do exists).
create policy "fotos_post: leitura" on public.fotos_post
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
revoke update on public.fotos_post from anon, authenticated;

create function private.limitar_fotos_post()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.fotos_post where post_id = new.post_id) >= 4 then
    raise exception 'Limite de 4 fotos por post.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger fotos_post_limite
  before insert on public.fotos_post
  for each row execute function private.limitar_fotos_post();

-- ----------------------------------------------------------- denúncias

alter type public.alvo_denuncia add value 'post';
