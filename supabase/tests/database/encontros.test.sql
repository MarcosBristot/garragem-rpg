-- Encontros: só quem tem conta vê; bloqueio esconde; datas no futuro;
-- limite diário; só o organizador edita; presença só em encontro aberto;
-- de quem vai, só o número aparece.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values
  ('ec000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('ec000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('ec000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('ec000000-0000-0000-0000-00000000000a', 'ana_enc', now(), 'v1'),
  ('ec000000-0000-0000-0000-00000000000b', 'beto_enc', now(), 'v1'),
  ('ec000000-0000-0000-0000-00000000000c', 'caio_enc', now(), 'v1');

-- A Ana organiza um encontro amanhã.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.encontros (id, titulo, tipo, local_nome, lat, lng, inicio, fim) values
  ('ee000000-0000-0000-0000-000000000001', 'Encontro de teste', 'encontro', 'Praça Fictícia',
   -23.55, -46.63, now() + interval '1 day', now() + interval '1 day 4 hours');
select throws_ok(
  $$insert into public.encontros (titulo, tipo, local_nome, lat, lng, inicio, fim)
      values ('No passado', 'encontro', 'Lugar', -23.5, -46.6, now() - interval '1 day', now())$$,
  '23514', null, 'não dá para criar encontro que já começou'
);
select throws_ok(
  $$insert into public.encontros (titulo, tipo, local_nome, lat, lng, inicio, fim)
      values ('Longo demais', 'encontro', 'Lugar', -23.5, -46.6, now() + interval '1 day', now() + interval '5 days')$$,
  '23514', null, 'dura no máximo 3 dias'
);
select throws_ok(
  $$insert into public.encontros (titulo, tipo, local_nome, lat, lng, inicio, fim)
      values ('Tipo estranho', 'festa', 'Lugar', -23.5, -46.6, now() + interval '1 day', now() + interval '1 day 2 hours')$$,
  '23514', null, 'tipo só da lista'
);
reset role;

-- Beto vê, confirma presença e não vê quem mais vai.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.encontros where id = 'ee000000-0000-0000-0000-000000000001'),
  1::bigint, 'quem tem conta vê o encontro');
insert into public.presencas (encontro_id) values ('ee000000-0000-0000-0000-000000000001');
update public.encontros set titulo = 'Hackeado' where id = 'ee000000-0000-0000-0000-000000000001';
reset role;
select is((select titulo from public.encontros where id = 'ee000000-0000-0000-0000-000000000001'),
  'Encontro de teste', 'só o organizador edita');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
insert into public.presencas (encontro_id) values ('ee000000-0000-0000-0000-000000000001');
select is((select count(*) from public.presencas), 1::bigint, 'cada um só vê a própria presença');
select is(
  (select vao from public.resumo_encontros(array['ee000000-0000-0000-0000-000000000001'::uuid])),
  2, 'o resumo traz o total de quem vai'
);
select is(
  (select eu_vou from public.resumo_encontros(array['ee000000-0000-0000-0000-000000000001'::uuid])),
  true, 'e se eu vou'
);
reset role;

-- A Ana bloqueia o Caio: ele deixa de ver o encontro e o resumo.
insert into public.bloqueios (bloqueador_id, bloqueado_id) values
  ('ec000000-0000-0000-0000-00000000000a', 'ec000000-0000-0000-0000-00000000000c');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is((select count(*) from public.encontros where id = 'ee000000-0000-0000-0000-000000000001'),
  0::bigint, 'bloqueado não vê o encontro');
select is((select count(*) from public.resumo_encontros(array['ee000000-0000-0000-0000-000000000001'::uuid])),
  0::bigint, 'nem o resumo');
reset role;

-- Encontro que já acabou: some do mapa. (O gatilho não deixa pôr data no
-- passado; aqui o desligamos só para simular o tempo passando.)
alter table public.encontros disable trigger encontros_validar;
update public.encontros set inicio = now() - interval '3 days', fim = now() - interval '2 days 20 hours'
 where id = 'ee000000-0000-0000-0000-000000000001';
alter table public.encontros enable trigger encontros_validar;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.encontros where id = 'ee000000-0000-0000-0000-000000000001'),
  0::bigint, 'encontro terminado há mais de um dia sai da lista');
reset role;

-- Limite: 5 encontros por dia.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ec000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.encontros (titulo, tipo, local_nome, lat, lng, inicio, fim)
      select 'Encontro ' || n, 'role', 'Lugar', -23.5, -46.6, now() + interval '2 days', now() + interval '2 days 1 hour'
        from generate_series(1, 5) n$$,
  'cria até 5 encontros por dia'
);
select throws_ok(
  $$insert into public.encontros (titulo, tipo, local_nome, lat, lng, inicio, fim)
      values ('O sexto', 'role', 'Lugar', -23.5, -46.6, now() + interval '2 days', now() + interval '2 days 1 hour')$$,
  '23514', null, 'o 6º no mesmo dia é recusado'
);
reset role;

select * from finish();
rollback;
