-- Denúncias de conteúdo público (regra 5 do projeto). Usuários só
-- INSEREM; ninguém lê pela API: a moderação é feita pelo painel do
-- Supabase (papel de serviço), por enquanto.

create type public.motivo_denuncia as enum (
  'dados_pessoais', -- expõe CPF, endereço, placa ou localização de alguém
  'ofensivo',       -- ódio, assédio, violência
  'direitos',       -- foto ou conteúdo de terceiros sem autorização
  'golpe',          -- golpe, fraude ou spam
  'outro'
);

create type public.alvo_denuncia as enum ('carro', 'perfil', 'registro');

create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  -- Ao excluir a conta, a denúncia fica (para a moderação), mas anônima.
  denunciante_id uuid default auth.uid()
    references public.perfis (id) on delete set null,
  alvo_tipo public.alvo_denuncia not null,
  alvo_id uuid not null,
  motivo public.motivo_denuncia not null,
  detalhes text check (char_length(detalhes) <= 1000),
  criado_em timestamptz not null default now(),
  -- A mesma pessoa não denuncia o mesmo conteúdo duas vezes.
  unique (denunciante_id, alvo_tipo, alvo_id)
);

alter table public.denuncias enable row level security;

create policy "denuncias: usuário cria em nome próprio" on public.denuncias
  for insert to authenticated
  with check (denunciante_id = (select auth.uid()));
-- Sem política de SELECT/UPDATE/DELETE: ninguém lê nem altera pela API.
revoke select, update, delete, truncate on public.denuncias from anon, authenticated;

-- Limite contra abuso: até 10 denúncias por pessoa a cada 24 h.
create function private.limitar_denuncias()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.denuncias
       where denunciante_id = new.denunciante_id
         and criado_em > now() - interval '24 hours') >= 10 then
    raise exception 'Limite diário de denúncias atingido.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger denuncias_limite
  before insert on public.denuncias
  for each row execute function private.limitar_denuncias();
