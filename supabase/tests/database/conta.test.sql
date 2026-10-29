-- Testes de LGPD: aceite dos termos e exclusão da conta pelo titular.
-- Dados 100% fictícios; transação desfeita no fim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('10000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('10000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('10000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('10000000-0000-0000-0000-00000000000a', 'ana_t', now(), 'v1'),
  ('10000000-0000-0000-0000-00000000000b', 'beto_t', now(), 'v1');
insert into public.carros (dono_id, marca, modelo) values
  ('10000000-0000-0000-0000-00000000000b', 'Marca', 'Modelo');

-- ------------------------------------------- aceite (Caio, sem perfil)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.perfis (id, nome_usuario) values ('10000000-0000-0000-0000-00000000000c', 'caio_t')$$,
  '42501', null, 'perfil sem aceite dos termos é recusado'
);
select lives_ok(
  $$insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos)
    values ('10000000-0000-0000-0000-00000000000c', 'caio_t', now(), 'v1')$$,
  'perfil com aceite é criado'
);
reset role;

-- ------------------------------------------------- Ana edita o perfil
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select lives_ok(
  $$update public.perfis set cidade = 'Cidade Teste' where id = '10000000-0000-0000-0000-00000000000a'$$,
  'pode editar a cidade'
);
select throws_ok(
  $$update public.perfis set termos_aceitos_em = null where id = '10000000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'não pode apagar o registro do aceite'
);
reset role;

-- --------------------------------------------- exclusão da conta
set local role anon;
select throws_ok(
  'select public.excluir_minha_conta()',
  '42501', null, 'visitante anônimo não executa a exclusão'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok('select public.excluir_minha_conta()', 'Beto exclui a própria conta');
reset role;

select is(
  (select count(*) from auth.users where id = '10000000-0000-0000-0000-00000000000b'),
  0::bigint, 'usuário do Beto removido'
);
select is(
  (select count(*) from public.carros where dono_id = '10000000-0000-0000-0000-00000000000b'),
  0::bigint, 'carros do Beto removidos em cascata'
);
select is(
  (select count(*) from auth.users where id in (
    '10000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000c')),
  2::bigint, 'as outras contas continuam'
);

select * from finish();
rollback;
