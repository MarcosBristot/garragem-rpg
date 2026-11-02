-- Curtidas e comentários: só em post visível; nunca curtir o próprio post;
-- uma curtida por pessoa; bloqueio esconde comentários nos dois sentidos;
-- dono do post modera os comentários dele.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('80000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('80000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('80000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('80000000-0000-0000-0000-00000000000a', 'ana_curte', now(), 'v1'),
  ('80000000-0000-0000-0000-00000000000b', 'beto_curte', now(), 'v1'),
  ('80000000-0000-0000-0000-00000000000c', 'caio_curte', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo, publico) values
  ('c8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-00000000000a', 'Marca', 'Modelo', true);
insert into public.posts (id, dono_id, carro_id) values
  ('e8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-00000000000a', 'c8000000-0000-0000-0000-000000000001');

-- Ana não curte o próprio post
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.curtidas (post_id) values ('e8000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'ninguém curte o próprio post'
);
reset role;

-- Beto curte e comenta
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.curtidas (post_id) values ('e8000000-0000-0000-0000-000000000001')$$,
  'outra pessoa curte'
);
select throws_ok(
  $$insert into public.curtidas (post_id) values ('e8000000-0000-0000-0000-000000000001')$$,
  '23505', null, 'uma curtida por pessoa'
);
select throws_ok(
  $$insert into public.curtidas (post_id, perfil_id)
    values ('e8000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-00000000000c')$$,
  '42501', null, 'não curte em nome de outra pessoa'
);
insert into public.comentarios (id, post_id, texto) values
  ('f8000000-0000-0000-0000-000000000001', 'e8000000-0000-0000-0000-000000000001', 'Ficou top!');
select throws_ok(
  $$insert into public.comentarios (post_id, texto) values ('e8000000-0000-0000-0000-000000000001', '')$$,
  '23514', null, 'comentário vazio não entra'
);
reset role;

-- Caio comenta; não apaga o comentário do Beto
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
insert into public.comentarios (id, post_id, texto) values
  ('f8000000-0000-0000-0000-000000000002', 'e8000000-0000-0000-0000-000000000001', 'Comentário do Caio');
delete from public.comentarios where id = 'f8000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*) from public.comentarios where id = 'f8000000-0000-0000-0000-000000000001'),
  1::bigint, 'ninguém apaga o comentário de outra pessoa'
);

-- Ana (dona do post) bloqueia o Caio e apaga o comentário dele
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.bloqueios (bloqueado_id) values ('80000000-0000-0000-0000-00000000000c');
select is(
  (select count(*) from public.comentarios where post_id = 'e8000000-0000-0000-0000-000000000001'),
  1::bigint, 'quem bloqueou não vê comentários de quem foi bloqueado'
);
delete from public.comentarios where id = 'f8000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select count(*) from public.comentarios where id = 'f8000000-0000-0000-0000-000000000001'),
  0::bigint, 'dono do post apaga comentários no próprio post'
);

-- Caio, bloqueado, não vê nem interage
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"80000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select is(
  (select count(*) from public.curtidas where post_id = 'e8000000-0000-0000-0000-000000000001'),
  0::bigint, 'bloqueado não vê as curtidas do post'
);
select throws_ok(
  $$insert into public.curtidas (post_id) values ('e8000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'bloqueado não curte'
);
select throws_ok(
  $$insert into public.comentarios (post_id, texto) values ('e8000000-0000-0000-0000-000000000001', 'oi')$$,
  '42501', null, 'bloqueado não comenta'
);
reset role;

set local role anon;
select is((select count(*) from public.comentarios), 0::bigint, 'sem conta não vê comentários');
reset role;

select * from finish();
rollback;
