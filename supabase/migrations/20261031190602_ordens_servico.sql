-- Ordem de serviço (OS) anexada a um registro. Documento SEMPRE privado:
-- a foto pode ter CPF, endereço e telefone do cliente (regra 2). Não entra
-- em nenhuma view pública. Uma OS por registro.
create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  registro_id uuid not null unique references public.registros (id) on delete cascade,
  dono_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  -- Foto da OS no armazenamento privado, no "diretório" do próprio dono.
  foto_chave text check (foto_chave like 'u/' || dono_id::text || '/c/%'),
  oficina text check (char_length(oficina) <= 120),
  data date,
  km integer check (km >= 0),
  total_centavos integer check (total_centavos >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.ordens_servico enable row level security;

create policy "os: dono do registro faz tudo" on public.ordens_servico
  for all to authenticated
  using (dono_id = (select auth.uid()))
  with check (
    dono_id = (select auth.uid())
    and exists (
      select 1 from public.registros r
       where r.id = registro_id and r.dono_id = (select auth.uid())
    )
  );

create trigger ordens_servico_atualizado_em
  before update on public.ordens_servico
  for each row execute function private.tocar_atualizado_em();
