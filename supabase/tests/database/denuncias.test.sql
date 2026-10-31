-- Testes das denúncias: só insere, ninguém lê, sem repetição, limite diário.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, email) values
  ('30000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('30000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('30000000-0000-0000-0000-00000000000a', 'ana_d', now(), 'v1'),
  ('30000000-0000-0000-0000-00000000000b', 'beto_d', now(), 'v1');

set local role anon;
select throws_ok(
  $$insert into public.denuncias (alvo_tipo, alvo_id, motivo)
    values ('perfil', '30000000-0000-0000-0000-00000000000a', 'ofensivo')$$,
  '42501', null, 'visitante sem conta não denuncia'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select lives_ok(
  $$insert into public.denuncias (alvo_tipo, alvo_id, motivo, detalhes)
    values ('perfil', '30000000-0000-0000-0000-00000000000a', 'ofensivo', 'Texto fictício')$$,
  'usuário logado denuncia'
);
select throws_ok(
  $$insert into public.denuncias (alvo_tipo, alvo_id, motivo)
    values ('perfil', '30000000-0000-0000-0000-00000000000a', 'golpe')$$,
  '23505', null, 'não denuncia o mesmo conteúdo duas vezes'
);
select throws_ok(
  $$insert into public.denuncias (denunciante_id, alvo_tipo, alvo_id, motivo)
    values ('30000000-0000-0000-0000-00000000000a', 'carro', gen_random_uuid(), 'outro')$$,
  '42501', null, 'não denuncia em nome de outra pessoa'
);
select throws_ok(
  'select count(*) from public.denuncias',
  '42501', null, 'ninguém lê denúncias pela API'
);

-- Mais 9 (total 10) passam; a 11ª no mesmo dia é barrada.
select lives_ok(
  $$insert into public.denuncias (alvo_tipo, alvo_id, motivo)
    select 'carro', gen_random_uuid(), 'outro' from generate_series(1, 9)$$,
  'até 10 denúncias por dia'
);
select throws_ok(
  $$insert into public.denuncias (alvo_tipo, alvo_id, motivo)
    values ('carro', gen_random_uuid(), 'outro')$$,
  '23514', null, 'a 11ª denúncia do dia é barrada'
);
reset role;

-- Excluir a conta do denunciante deixa a denúncia anônima.
delete from auth.users where id = '30000000-0000-0000-0000-00000000000b';
select is(
  (select count(*) from public.denuncias
    where alvo_id = '30000000-0000-0000-0000-00000000000a' and denunciante_id is null),
  1::bigint, 'denúncia fica anônima após excluir a conta'
);

select * from finish();
rollback;
