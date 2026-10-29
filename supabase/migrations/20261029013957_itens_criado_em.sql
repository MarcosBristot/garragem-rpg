-- Ordem de exibição dos itens: o id é UUID aleatório, então não serve.
-- Linhas existentes recebem now() no momento da migração.
alter table public.itens_registro
  add column criado_em timestamptz not null default now();

create index on public.itens_registro (registro_id, criado_em);
