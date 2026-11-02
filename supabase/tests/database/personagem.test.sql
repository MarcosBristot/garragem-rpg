-- Personagem: dono edita o próprio; formato e tamanho garantidos no banco;
-- ninguém mexe no de outra pessoa; visível a todos como o resto do perfil.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('60000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('60000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('60000000-0000-0000-0000-00000000000a', 'ana_boneco', now(), 'v1'),
  ('60000000-0000-0000-0000-00000000000b', 'beto_boneco', now(), 'v1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

update public.perfis set personagem = '{"pele":"t1","cabelo":"curto"}'
  where id = '60000000-0000-0000-0000-00000000000a';
select is(
  (select personagem->>'cabelo' from public.perfis where id = '60000000-0000-0000-0000-00000000000a'),
  'curto', 'dona edita o próprio personagem'
);

select throws_ok(
  $$update public.perfis set personagem = '["t1"]' where id = '60000000-0000-0000-0000-00000000000a'$$,
  '23514', null, 'personagem precisa ser um objeto'
);
select throws_ok(
  $$update public.perfis set personagem = jsonb_build_object('x', repeat('a', 1000))
    where id = '60000000-0000-0000-0000-00000000000a'$$,
  '23514', null, 'personagem tem tamanho máximo'
);

update public.perfis set personagem = '{"pele":"t6"}'
  where id = '60000000-0000-0000-0000-00000000000b';
reset role;
select ok(
  (select personagem is null from public.perfis where id = '60000000-0000-0000-0000-00000000000b'),
  'ninguém altera o personagem de outra pessoa'
);

set local role anon;
select is(
  (select personagem->>'pele' from public.perfis where id = '60000000-0000-0000-0000-00000000000a'),
  't1', 'personagem é público como o resto do perfil'
);
select throws_ok(
  $$update public.perfis set personagem = '{}'$$,
  '42501', null, 'anônimo não altera personagem'
);
reset role;

select * from finish();
rollback;
