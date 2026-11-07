-- Foto de perfil: dona troca a própria; só chave dentro da própria pasta;
-- ninguém mexe na de outra pessoa; visível a todos como o resto do perfil.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('f0000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('f0000000-0000-0000-0000-00000000000a', 'ana_foto', now(), 'v1'),
  ('f0000000-0000-0000-0000-00000000000b', 'beto_foto', now(), 'v1');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

update public.perfis
   set foto = 'u/f0000000-0000-0000-0000-00000000000a/perfil/f1000000-0000-0000-0000-000000000001'
 where id = 'f0000000-0000-0000-0000-00000000000a';
select isnt(
  (select foto from public.perfis where id = 'f0000000-0000-0000-0000-00000000000a'),
  null, 'dona troca a própria foto'
);

select throws_ok(
  $$update public.perfis
       set foto = 'u/f0000000-0000-0000-0000-00000000000b/perfil/x'
     where id = 'f0000000-0000-0000-0000-00000000000a'$$,
  '23514', null, 'a chave tem de ficar na pasta da própria pessoa'
);
select throws_ok(
  $$update public.perfis
       set foto = 'u/f0000000-0000-0000-0000-00000000000a/c/qualquer'
     where id = 'f0000000-0000-0000-0000-00000000000a'$$,
  '23514', null, 'e na subpasta perfil/'
);

update public.perfis
   set foto = 'u/f0000000-0000-0000-0000-00000000000b/perfil/x'
 where id = 'f0000000-0000-0000-0000-00000000000b';
reset role;
select is(
  (select foto from public.perfis where id = 'f0000000-0000-0000-0000-00000000000b'),
  null, 'ninguém mexe na foto de outra pessoa'
);

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select isnt(
  (select foto from public.perfis where id = 'f0000000-0000-0000-0000-00000000000a'),
  null, 'visitante vê a foto, como o resto do perfil'
);
reset role;

select * from finish();
rollback;
