-- Feed: post só em carro próprio e público; carro privado some do feed;
-- bloqueio esconde nos dois sentidos e desfaz o seguir; limites; e a
-- função de bloqueio não vaza pela API.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, email) values
  ('70000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('70000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('70000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('70000000-0000-0000-0000-00000000000a', 'ana_feed', now(), 'v1'),
  ('70000000-0000-0000-0000-00000000000b', 'beto_feed', now(), 'v1'),
  ('70000000-0000-0000-0000-00000000000c', 'caio_feed', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo, publico) values
  ('c7000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-00000000000a', 'Marca', 'Público', true),
  ('c7000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-00000000000a', 'Marca', 'Privado', false),
  ('c7000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-00000000000b', 'Marca', 'Do Beto', true);

-- Ana publica
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.posts (id, carro_id, legenda)
    values ('e7000000-0000-0000-0000-000000000001', 'c7000000-0000-0000-0000-000000000001', 'Lavado!')$$,
  'dona publica em carro público'
);
select throws_ok(
  $$insert into public.posts (carro_id) values ('c7000000-0000-0000-0000-000000000002')$$,
  '42501', null, 'não publica em carro privado'
);
select throws_ok(
  $$insert into public.posts (carro_id) values ('c7000000-0000-0000-0000-000000000003')$$,
  '42501', null, 'não publica no carro de outra pessoa'
);
select lives_ok(
  $$insert into public.fotos_post (post_id, chave, largura, altura) values (
    'e7000000-0000-0000-0000-000000000001',
    'u/70000000-0000-0000-0000-00000000000a/c/c7000000-0000-0000-0000-000000000001/p/e7000000-0000-0000-0000-000000000001/f1',
    1080, 1080)$$,
  'dona adiciona foto no diretório do post'
);
select throws_ok(
  $$insert into public.fotos_post (post_id, chave, largura, altura) values (
    'e7000000-0000-0000-0000-000000000001',
    'u/70000000-0000-0000-0000-00000000000b/c/x/p/e7000000-0000-0000-0000-000000000001/f2',
    1080, 1080)$$,
  '23514', null, 'foto não aponta para arquivo de outra pessoa'
);
insert into public.fotos_post (post_id, chave, largura, altura)
  select 'e7000000-0000-0000-0000-000000000001',
         'u/70000000-0000-0000-0000-00000000000a/c/c7000000-0000-0000-0000-000000000001/p/e7000000-0000-0000-0000-000000000001/f' || n,
         1080, 1080
    from generate_series(2, 4) n;
select throws_ok(
  $$insert into public.fotos_post (post_id, chave, largura, altura) values (
    'e7000000-0000-0000-0000-000000000001',
    'u/70000000-0000-0000-0000-00000000000a/c/c7000000-0000-0000-0000-000000000001/p/e7000000-0000-0000-0000-000000000001/f5',
    1080, 1080)$$,
  '23514', null, 'no máximo 4 fotos por post'
);
select throws_ok(
  $$update public.posts set criado_em = now() + interval '1 year'$$,
  '42501', null, 'só a legenda pode ser editada'
);
reset role;

-- Beto vê, segue e não consegue mexer
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  (select count(*) from public.posts where id = 'e7000000-0000-0000-0000-000000000001'),
  1::bigint, 'outra pessoa com conta vê o post'
);
select is(
  (select count(*) from public.fotos_post where post_id = 'e7000000-0000-0000-0000-000000000001'),
  4::bigint, 'e vê as fotos do post'
);
insert into public.seguidores (seguido_id) values ('70000000-0000-0000-0000-00000000000a');
delete from public.posts where id = 'e7000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*) from public.posts where id = 'e7000000-0000-0000-0000-000000000001'),
  1::bigint, 'ninguém apaga o post de outra pessoa'
);

-- Ana bloqueia Beto
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.bloqueios (bloqueado_id) values ('70000000-0000-0000-0000-00000000000b');
reset role;
select is(
  (select count(*) from public.seguidores
    where seguidor_id = '70000000-0000-0000-0000-00000000000b'
      and seguido_id = '70000000-0000-0000-0000-00000000000a'),
  0::bigint, 'bloquear desfaz o seguir'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  (select count(*) from public.posts where dono_id = '70000000-0000-0000-0000-00000000000a'),
  0::bigint, 'quem foi bloqueado não vê os posts de quem bloqueou'
);
select is((select count(*) from public.bloqueios), 0::bigint, 'e não sabe que foi bloqueado');
select throws_ok(
  $$insert into public.seguidores (seguido_id) values ('70000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'nem consegue voltar a seguir'
);
select throws_ok(
  $$select private.conceder_xp(gen_random_uuid(), 'item', gen_random_uuid())$$,
  '42501', null, 'funções internas do schema private não são executáveis'
);
reset role;

-- Caio (sem bloqueio) deixa de ver quando o carro vira privado
update public.carros set publico = false where id = 'c7000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(
  (select count(*) from public.posts where id = 'e7000000-0000-0000-0000-000000000001'),
  0::bigint, 'carro voltou a privado: o post some do feed'
);
reset role;

set local role anon;
select is((select count(*) from public.posts), 0::bigint, 'sem conta não vê o feed');
reset role;

select * from finish();
rollback;
