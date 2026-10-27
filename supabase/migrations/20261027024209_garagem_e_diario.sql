-- Fase 1: garagem e diário.
--
-- Modelo de segurança:
--   * Tabelas base: RLS ligada; só o dono lê e escreve (exceto perfis e
--     carros públicos, cujas colunas são todas seguras).
--   * Leitura pública de registros e itens: só pelas views *_publicos,
--     que escolhem colunas seguras (sem notas) e escondem valores quando
--     a visibilidade é 'publico_sem_valor'. RLS filtra linhas, não colunas,
--     por isso as views existem.
--   * Histórico de edições: escrito só por trigger; ninguém altera.
--   * Excluir a conta (auth.users) apaga tudo em cascata (LGPD).

-- Funções internas ficam fora do schema exposto pela API.
create schema if not exists private;

create type public.visibilidade as enum ('privado', 'publico_sem_valor', 'publico');
create type public.tipo_registro as enum ('manutencao', 'modificacao');
create type public.espaco_equipamento as enum (
  'motor', 'suspensao', 'rodas', 'freios', 'estetica', 'som'
);

-- ---------------------------------------------------------------- perfis
-- Extensão pública de auth.users. Só cidade: nunca endereço (regra 1).
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_usuario text not null unique check (nome_usuario ~ '^[a-z0-9_]{3,30}$'),
  nome_exibicao text check (char_length(nome_exibicao) <= 60),
  cidade text check (char_length(cidade) <= 80),
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- carros
-- Sem placa: identifica o carro na rua (regra 1).
create table public.carros (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  marca text not null check (char_length(marca) between 1 and 40),
  modelo text not null check (char_length(modelo) between 1 and 60),
  ano smallint check (ano between 1886 and 2100),
  apelido text check (char_length(apelido) <= 40),
  publico boolean not null default false,
  criado_em timestamptz not null default now(),
  -- Alvo da FK composta de registros (garante dono coerente).
  unique (id, dono_id)
);

-- ------------------------------------------------------------- registros
create table public.registros (
  id uuid primary key default gen_random_uuid(),
  carro_id uuid not null,
  dono_id uuid not null default auth.uid(),
  tipo public.tipo_registro not null,
  titulo text not null check (char_length(titulo) between 1 and 120),
  data date not null,
  km integer check (km >= 0),
  -- Pode conter CPF/endereço: nunca sai das tabelas base (regra 2).
  notas text check (char_length(notas) <= 5000),
  visibilidade public.visibilidade not null default 'privado',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  -- dono_id é cópia do dono do carro (simplifica RLS); a FK composta
  -- impede que os dois divirjam.
  foreign key (carro_id, dono_id) references public.carros (id, dono_id) on delete cascade
);

create index on public.registros (carro_id, data desc);
create index on public.registros (dono_id);

-- -------------------------------------------------------- itens_registro
create table public.itens_registro (
  id uuid primary key default gen_random_uuid(),
  registro_id uuid not null references public.registros (id) on delete cascade,
  descricao text not null check (char_length(descricao) between 1 and 120),
  categoria text not null check (char_length(categoria) between 1 and 40),
  quantidade numeric(10, 2) not null default 1 check (quantidade > 0),
  -- Centavos, inteiro: sem erro de arredondamento.
  valor_centavos integer check (valor_centavos >= 0),
  espaco public.espaco_equipamento
);

create index on public.itens_registro (registro_id);

-- ----------------------------------------------------- historico_edicoes
create table public.historico_edicoes (
  id bigint generated always as identity primary key,
  registro_id uuid not null references public.registros (id) on delete cascade,
  dono_id uuid not null references public.perfis (id) on delete cascade,
  tabela text not null check (tabela in ('registros', 'itens_registro')),
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  antes jsonb,
  depois jsonb,
  editado_em timestamptz not null default now()
);

create index on public.historico_edicoes (registro_id, editado_em);

-- -------------------------------------------------------------- triggers
create function private.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger registros_atualizado_em
  before update on public.registros
  for each row execute function private.tocar_atualizado_em();

-- security definer: grava no histórico mesmo sem política de INSERT
-- para usuários. search_path vazio evita sequestro de nomes.
create function private.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro_id uuid;
  v_dono_id uuid;
begin
  if tg_table_name = 'registros' then
    v_registro_id := new.id;
    v_dono_id := new.dono_id;
  else
    v_registro_id := coalesce(new.registro_id, old.registro_id);
    select r.dono_id into v_dono_id
      from public.registros r
     where r.id = v_registro_id;
    -- Registro pai sendo apagado em cascata: nada a registrar.
    if v_dono_id is null then
      return null;
    end if;
  end if;

  insert into public.historico_edicoes
    (registro_id, dono_id, tabela, operacao, antes, depois)
  values (
    v_registro_id,
    v_dono_id,
    tg_table_name,
    tg_op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end;
$$;

create trigger registros_historico
  after update on public.registros
  for each row execute function private.registrar_historico();

create trigger itens_registro_historico
  after insert or update or delete on public.itens_registro
  for each row execute function private.registrar_historico();

-- ------------------------------------------------------------------- RLS
alter table public.perfis enable row level security;
alter table public.carros enable row level security;
alter table public.registros enable row level security;
alter table public.itens_registro enable row level security;
alter table public.historico_edicoes enable row level security;

-- (select auth.uid()) em vez de auth.uid(): o Postgres calcula uma vez
-- por consulta, não uma vez por linha.

create policy "perfis: todos leem" on public.perfis
  for select to anon, authenticated using (true);
create policy "perfis: cria o próprio" on public.perfis
  for insert to authenticated with check (id = (select auth.uid()));
create policy "perfis: edita o próprio" on public.perfis
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "carros: públicos ou do dono" on public.carros
  for select to anon, authenticated
  using (publico or dono_id = (select auth.uid()));
create policy "carros: dono cria" on public.carros
  for insert to authenticated with check (dono_id = (select auth.uid()));
create policy "carros: dono edita" on public.carros
  for update to authenticated
  using (dono_id = (select auth.uid())) with check (dono_id = (select auth.uid()));
create policy "carros: dono apaga" on public.carros
  for delete to authenticated using (dono_id = (select auth.uid()));

create policy "registros: dono faz tudo" on public.registros
  for all to authenticated
  using (dono_id = (select auth.uid())) with check (dono_id = (select auth.uid()));

create policy "itens: dono do registro faz tudo" on public.itens_registro
  for all to authenticated
  using (exists (
    select 1 from public.registros r
     where r.id = registro_id and r.dono_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.registros r
     where r.id = registro_id and r.dono_id = (select auth.uid())
  ));

create policy "historico: dono lê" on public.historico_edicoes
  for select to authenticated using (dono_id = (select auth.uid()));
-- Sem políticas de escrita: só o trigger grava.

-- ------------------------------------------------------- views públicas
-- security_invoker = false: a view roda com os privilégios do dono dela
-- (postgres) e por isso enxerga as tabelas base. A segurança está
-- inteiramente no WHERE e na lista de colunas abaixo — e nos testes.
create view public.registros_publicos
with (security_invoker = false, security_barrier = true) as
select r.id, r.carro_id, r.dono_id, r.tipo, r.titulo, r.data, r.km,
       r.visibilidade, r.criado_em
  from public.registros r
  join public.carros c on c.id = r.carro_id
 where c.publico
   and r.visibilidade <> 'privado';

create view public.itens_publicos
with (security_invoker = false, security_barrier = true) as
select i.id, i.registro_id, i.descricao, i.categoria, i.quantidade, i.espaco,
       case when r.visibilidade = 'publico' then i.valor_centavos end as valor_centavos
  from public.itens_registro i
  join public.registros_publicos r on r.id = i.registro_id;

-- Views herdam permissões padrão amplas no Supabase; deixamos só leitura.
revoke all on public.registros_publicos, public.itens_publicos from anon, authenticated;
grant select on public.registros_publicos, public.itens_publicos to anon, authenticated;

-- Histórico é só leitura para qualquer papel da API.
revoke insert, update, delete, truncate on public.historico_edicoes from anon, authenticated;
