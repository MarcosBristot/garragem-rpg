-- XP por carro (regra 4: jogo justo). Cada ponto é um evento gravado
-- SÓ por triggers do banco; usuários apenas leem os próprios eventos.
-- Nível e atributos são derivados da soma, nunca guardados soltos.
-- Dinheiro gasto não entra: um item de R$ 5.000 vale o mesmo que um de R$ 10.

create type public.acao_xp as enum (
  'manutencao', 'modificacao', 'item', 'foto', 'ordem_servico'
);

create table public.eventos_xp (
  id bigint generated always as identity primary key,
  carro_id uuid not null references public.carros (id) on delete cascade,
  dono_id uuid not null references public.perfis (id) on delete cascade,
  -- Apagar o registro apaga o XP que veio dele (sem farm de criar/apagar).
  registro_id uuid not null references public.registros (id) on delete cascade,
  acao public.acao_xp not null,
  pontos integer not null check (pontos > 0),
  -- Linha que gerou o XP (registro, item, foto ou OS): uma vez só.
  origem_id uuid not null,
  criado_em timestamptz not null default now(),
  unique (acao, origem_id)
);

create index on public.eventos_xp (carro_id);
create index on public.eventos_xp (dono_id, acao, criado_em);

alter table public.eventos_xp enable row level security;
create policy "xp: dono lê" on public.eventos_xp
  for select to authenticated using (dono_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.eventos_xp from anon, authenticated;

-- Tabela de pontos e limites diários (mesmos valores de src/dominio/xp.ts).
create function private.regra_xp(p_acao public.acao_xp, out pontos integer, out limite_dia integer)
language sql immutable
as $$
  select case p_acao
           when 'manutencao' then 30 when 'modificacao' then 20
           when 'item' then 5 when 'foto' then 5 when 'ordem_servico' then 15
         end,
         case p_acao
           when 'manutencao' then 3 when 'modificacao' then 3
           when 'item' then 10 when 'foto' then 6 when 'ordem_servico' then 2
         end;
$$;

-- Concede XP respeitando o limite diário (dia de São Paulo). Passou do
-- limite: a ação vale, só não rende XP (sem erro para o usuário).
create function private.conceder_xp(
  p_registro_id uuid, p_acao public.acao_xp, p_origem_id uuid
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_carro uuid;
  v_dono uuid;
  v_regra record;
  v_hoje_sp date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select r.carro_id, r.dono_id into v_carro, v_dono
    from public.registros r where r.id = p_registro_id;
  if v_carro is null then return; end if;

  select * into v_regra from private.regra_xp(p_acao);
  if (select count(*) from public.eventos_xp e
       where e.dono_id = v_dono and e.acao = p_acao
         and (e.criado_em at time zone 'America/Sao_Paulo')::date = v_hoje_sp
     ) >= v_regra.limite_dia then
    return;
  end if;

  insert into public.eventos_xp (carro_id, dono_id, registro_id, acao, pontos, origem_id)
  values (v_carro, v_dono, p_registro_id, p_acao, v_regra.pontos, p_origem_id)
  on conflict (acao, origem_id) do nothing;
end;
$$;

create function private.xp_ao_inserir()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  case tg_table_name
    when 'registros' then
      perform private.conceder_xp(new.id, new.tipo::text::public.acao_xp, new.id);
    when 'itens_registro' then
      perform private.conceder_xp(new.registro_id, 'item', new.id);
    when 'fotos_registro' then
      perform private.conceder_xp(new.registro_id, 'foto', new.id);
    when 'ordens_servico' then
      perform private.conceder_xp(new.registro_id, 'ordem_servico', new.id);
  end case;
  return null;
end;
$$;

-- Item, foto ou OS apagados sozinhos levam o XP junto.
create function private.xp_ao_apagar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.eventos_xp where origem_id = old.id;
  return null;
end;
$$;

create trigger registros_xp after insert on public.registros
  for each row execute function private.xp_ao_inserir();
create trigger itens_registro_xp after insert on public.itens_registro
  for each row execute function private.xp_ao_inserir();
create trigger fotos_registro_xp after insert on public.fotos_registro
  for each row execute function private.xp_ao_inserir();
create trigger ordens_servico_xp after insert on public.ordens_servico
  for each row execute function private.xp_ao_inserir();

create trigger itens_registro_xp_apagar after delete on public.itens_registro
  for each row execute function private.xp_ao_apagar();
create trigger fotos_registro_xp_apagar after delete on public.fotos_registro
  for each row execute function private.xp_ao_apagar();
create trigger ordens_servico_xp_apagar after delete on public.ordens_servico
  for each row execute function private.xp_ao_apagar();
