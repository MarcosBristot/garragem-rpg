-- XP: só triggers gravam; pontos por ação; limite diário; dinheiro não
-- conta; apagar a origem apaga o XP; cada dono vê só o seu.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('50000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('50000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('50000000-0000-0000-0000-00000000000a', 'ana_xp', now(), 'v1'),
  ('50000000-0000-0000-0000-00000000000b', 'beto_xp', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo) values
  ('c5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-00000000000a', 'Marca', 'Modelo');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

insert into public.registros (id, carro_id, tipo, titulo, data) values
  ('d5000000-0000-0000-0000-000000000001', 'c5000000-0000-0000-0000-000000000001', 'manutencao', 'M1', '2026-01-01');
select is((select sum(pontos)::int from public.eventos_xp), 30, 'manutenção rende 30 XP');

insert into public.registros (id, carro_id, tipo, titulo, data) values
  ('d5000000-0000-0000-0000-000000000002', 'c5000000-0000-0000-0000-000000000001', 'modificacao', 'Mod', '2026-01-02');
select is((select pontos from public.eventos_xp where acao = 'modificacao'), 20, 'modificação rende 20 XP');

insert into public.registros (carro_id, tipo, titulo, data)
  select 'c5000000-0000-0000-0000-000000000001', 'manutencao', 'M' || n, '2026-01-03'
    from generate_series(2, 4) n;
select is((select count(*) from public.eventos_xp where acao = 'manutencao'), 3::bigint,
  'limite de 3 manutenções com XP por dia (a 4ª vale, mas não rende XP)');

insert into public.itens_registro (id, registro_id, descricao, categoria, valor_centavos) values
  ('e5000000-0000-0000-0000-000000000001', 'd5000000-0000-0000-0000-000000000001', 'Peça cara', 'peca', 500000),
  ('e5000000-0000-0000-0000-000000000002', 'd5000000-0000-0000-0000-000000000001', 'Peça barata', 'peca', 1000);
select results_eq(
  $$select pontos from public.eventos_xp where acao = 'item' order by id$$,
  array[5, 5],
  'item de R$ 5.000 vale o mesmo XP que um de R$ 10 (dinheiro não conta)'
);

delete from public.itens_registro where id = 'e5000000-0000-0000-0000-000000000001';
select is((select count(*) from public.eventos_xp where acao = 'item'), 1::bigint,
  'apagar o item apaga o XP dele');

select throws_ok(
  $$insert into public.eventos_xp (carro_id, dono_id, registro_id, acao, pontos, origem_id)
    values ('c5000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-00000000000a',
            'd5000000-0000-0000-0000-000000000001', 'manutencao', 9999, gen_random_uuid())$$,
  '42501', null, 'usuário não grava XP pela API'
);
select throws_ok(
  $$update public.eventos_xp set pontos = 9999$$,
  '42501', null, 'usuário não altera XP'
);

delete from public.registros where id = 'd5000000-0000-0000-0000-000000000001';
select is((select count(*) from public.eventos_xp where registro_id = 'd5000000-0000-0000-0000-000000000001'),
  0::bigint, 'apagar o registro apaga todo o XP que veio dele');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.eventos_xp), 0::bigint, 'outro usuário não vê o XP alheio');
reset role;

set local role anon;
select is((select count(*) from public.eventos_xp), 0::bigint, 'anônimo não vê XP');
reset role;

select ok(
  (select count(*) from public.eventos_xp where pontos <= 0) = 0,
  'nenhum evento com pontos zerados ou negativos'
);

select * from finish();
rollback;
