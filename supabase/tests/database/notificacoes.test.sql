-- Notificações: curtidas e comentários nos meus posts e novos seguidores;
-- nunca as minhas próprias ações; contador zera ao marcar como vistas;
-- bloqueio esconde; cada um só vê as suas; visitante não acessa.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('d1000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('d1000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('d1000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos, notificacoes_vistas_em) values
  ('d1000000-0000-0000-0000-00000000000a', 'ana_notif', now(), 'v1', now() - interval '1 day'),
  ('d1000000-0000-0000-0000-00000000000b', 'beto_notif', now(), 'v1', now() - interval '1 day'),
  ('d1000000-0000-0000-0000-00000000000c', 'caio_notif', now(), 'v1', now() - interval '1 day');
insert into public.carros (id, dono_id, marca, modelo, publico) values
  ('cd100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'Marca', 'Modelo', true);
insert into public.posts (id, dono_id, carro_id) values
  ('ed100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-00000000000a', 'cd100000-0000-0000-0000-000000000001');

-- Beto curte e comenta; Caio segue a Ana; a Ana comenta no próprio post.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.curtidas (post_id) values ('ed100000-0000-0000-0000-000000000001');
insert into public.comentarios (post_id, texto) values ('ed100000-0000-0000-0000-000000000001', 'Que carro!');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
insert into public.seguidores (seguido_id) values ('d1000000-0000-0000-0000-00000000000a');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.comentarios (post_id, texto) values ('ed100000-0000-0000-0000-000000000001', 'Obrigada!');

select results_eq(
  $$select tipo from public.minhas_notificacoes() order by tipo$$,
  array['comentario', 'curtida', 'seguidor'],
  'curtida, comentário e seguidor chegam para a dona do post'
);
select is(
  (select count(*) from public.minhas_notificacoes() where ator_id = 'd1000000-0000-0000-0000-00000000000a'),
  0::bigint, 'as próprias ações não viram notificação'
);
select is(
  (select trecho from public.minhas_notificacoes() where tipo = 'comentario'),
  'Que carro!', 'comentário traz o começo do texto'
);
select is(public.notificacoes_novas(), 3, 'três novas desde a última visita');
select public.marcar_notificacoes_vistas();
select is(public.notificacoes_novas(), 0, 'marcar como vistas zera o contador');
reset role;

-- Beto não vê as notificações da Ana (só as dele: nenhuma).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.minhas_notificacoes()), 0::bigint, 'cada um vê só as suas');
reset role;

-- A Ana bloqueia o Beto: a curtida e o comentário dele somem.
insert into public.bloqueios (bloqueador_id, bloqueado_id) values
  ('d1000000-0000-0000-0000-00000000000a', 'd1000000-0000-0000-0000-00000000000b');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is(
  (select count(*) from public.minhas_notificacoes() where ator_id = 'd1000000-0000-0000-0000-00000000000b'),
  0::bigint, 'bloqueio esconde as notificações dessa pessoa'
);
reset role;

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok($$select public.notificacoes_novas()$$, '42501', null, 'visitante sem conta não acessa');
reset role;

select * from finish();
rollback;
