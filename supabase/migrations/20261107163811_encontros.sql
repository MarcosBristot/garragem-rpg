-- Fase 5: encontros no mapa. Decisões do dono do produto:
-- - só quem tem conta vê (fora do Google e de visitantes); bloqueios valem;
-- - de quem vai, só o NÚMERO aparece (ninguém fica sabendo que você estará
--   em tal lugar e hora — regra 1, localização);
-- - o ponto é escolhido no mapa por quem organiza (lugar público); nada de
--   GPS. O encontro sai do mapa quando termina.
-- Latitude/longitude simples: para "o que está nesta área" basta. PostGIS
-- entra quando precisarmos de "perto de mim".

create table public.encontros (
  id uuid primary key default gen_random_uuid(),
  organizador_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 3 and 80),
  tipo text not null check (
    tipo in ('encontro', 'role', 'track_day', 'exposicao', 'outro')
  ),
  descricao text check (char_length(descricao) <= 1000),
  local_nome text not null check (char_length(local_nome) between 2 and 120),
  cidade text check (char_length(cidade) <= 80),
  lat numeric(8, 5) not null check (lat between -90 and 90),
  lng numeric(8, 5) not null check (lng between -180 and 180),
  inicio timestamptz not null,
  fim timestamptz not null,
  criado_em timestamptz not null default now(),
  check (fim > inicio and fim <= inicio + interval '72 hours')
);
create index on public.encontros (fim);
create index on public.encontros (lat, lng);
create index on public.encontros (organizador_id);

alter table public.encontros enable row level security;

create policy "encontros: quem tem conta vê os em andamento e futuros" on public.encontros
  for select to authenticated
  using (
    (fim > now() - interval '1 day' or organizador_id = (select auth.uid()))
    and not private.bloqueio_entre((select auth.uid()), organizador_id)
  );
create policy "encontros: cria em nome próprio" on public.encontros
  for insert to authenticated
  with check (organizador_id = (select auth.uid()));
create policy "encontros: organizador edita" on public.encontros
  for update to authenticated
  using (organizador_id = (select auth.uid()))
  with check (organizador_id = (select auth.uid()));
create policy "encontros: organizador apaga" on public.encontros
  for delete to authenticated
  using (organizador_id = (select auth.uid()));

-- Datas que dependem do relógio (CHECK não pode usar now()): o início tem
-- de ser no futuro (até 6 meses) ao criar ou ao mudar a data. E no máximo
-- 5 encontros criados por dia (contra spam).
create function private.validar_encontro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.inicio is distinct from old.inicio then
    if new.inicio < now() - interval '5 minutes'
       or new.inicio > now() + interval '180 days' then
      raise exception 'O encontro precisa começar no futuro (até 6 meses).'
        using errcode = '23514';
    end if;
  end if;
  if tg_op = 'INSERT' and (
    select count(*) from public.encontros
     where organizador_id = new.organizador_id
       and criado_em > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'Limite diário de encontros atingido.' using errcode = '23514';
  end if;
  -- Quem organiza não muda.
  if tg_op = 'UPDATE' then
    new.organizador_id := old.organizador_id;
    new.criado_em := old.criado_em;
  end if;
  return new;
end;
$$;
create trigger encontros_validar
  before insert or update on public.encontros
  for each row execute function private.validar_encontro();

-- ------------------------------------------------------------ presenças

create table public.presencas (
  encontro_id uuid not null references public.encontros (id) on delete cascade,
  perfil_id uuid not null default auth.uid()
    references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (encontro_id, perfil_id)
);
create index on public.presencas (perfil_id);

alter table public.presencas enable row level security;

-- Cada um só vê as próprias presenças; o total vem de resumo_encontros().
create policy "presencas: as próprias" on public.presencas
  for select to authenticated
  using (perfil_id = (select auth.uid()));
create policy "presencas: confirma em encontro visível que não acabou" on public.presencas
  for insert to authenticated
  with check (
    perfil_id = (select auth.uid())
    and exists (
      select 1 from public.encontros e
       where e.id = encontro_id and e.fim > now()
    )
  );
create policy "presencas: desiste" on public.presencas
  for delete to authenticated
  using (perfil_id = (select auth.uid()));
revoke update on public.presencas from anon, authenticated;

-- Quantos vão e se eu vou, só de encontros que eu posso ver.
create function public.resumo_encontros(p_ids uuid[])
returns table (encontro_id uuid, vao integer, eu_vou boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id,
         (select count(*)::integer from public.presencas p where p.encontro_id = e.id),
         exists (select 1 from public.presencas p
                  where p.encontro_id = e.id and p.perfil_id = (select auth.uid()))
    from public.encontros e
   where e.id = any (p_ids)
     and (select auth.uid()) is not null
     and not private.bloqueio_entre((select auth.uid()), e.organizador_id);
$$;
revoke execute on function public.resumo_encontros(uuid[]) from public, anon;
grant execute on function public.resumo_encontros(uuid[]) to authenticated;

-- Denunciar um encontro (regra 5).
alter type public.alvo_denuncia add value 'encontro';
