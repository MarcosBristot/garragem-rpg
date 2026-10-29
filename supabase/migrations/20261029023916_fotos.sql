-- Fotos: capa do carro e até 6 fotos por registro.
-- O banco guarda só a CHAVE do arquivo (não a URL); os arquivos ficam no
-- armazenamento S3 (R2 em produção), privado, servidos por URL assinada.
-- Os arquivos já chegam sem EXIF/GPS (src/lib/fotos/processar.ts).

-- Capa do carro. A chave precisa estar no "diretório" do próprio carro:
-- ninguém aponta a capa para o arquivo de outra pessoa.
alter table public.carros
  add column foto_capa text check (
    foto_capa is null
    or foto_capa like 'u/' || dono_id::text || '/c/' || id::text || '/capa/%'
  );

create table public.fotos_registro (
  id uuid primary key default gen_random_uuid(),
  registro_id uuid not null references public.registros (id) on delete cascade,
  dono_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  chave text not null unique check (chave like 'u/' || dono_id::text || '/c/%'),
  -- Texto alternativo (acessibilidade): o que a foto mostra.
  descricao text check (char_length(descricao) <= 200),
  largura integer not null check (largura > 0),
  altura integer not null check (altura > 0),
  criado_em timestamptz not null default now()
);

create index on public.fotos_registro (registro_id, criado_em);

alter table public.fotos_registro enable row level security;

create policy "fotos: dono do registro faz tudo" on public.fotos_registro
  for all to authenticated
  using (dono_id = (select auth.uid()))
  with check (
    dono_id = (select auth.uid())
    and exists (
      select 1 from public.registros r
       where r.id = registro_id and r.dono_id = (select auth.uid())
    )
  );

-- Limite de 6 fotos por registro, garantido no banco.
create function private.limitar_fotos_registro()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.fotos_registro
       where registro_id = new.registro_id) >= 6 then
    raise exception 'Limite de 6 fotos por registro.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger fotos_registro_limite
  before insert on public.fotos_registro
  for each row execute function private.limitar_fotos_registro();
