-- Seguir tem limite diário (150 em 24 h) contra robôs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

-- 151 perfis fictícios para seguir, mais o "robô".
insert into auth.users (id, email)
  select ('e5000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'alvo' || n || '@exemplo.test'
    from generate_series(1, 152) n;
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos)
  select ('e5000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'alvo_lim_' || n, now(), 'v1'
    from generate_series(1, 152) n;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e5000000-0000-0000-0000-000000000152","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.seguidores (seguido_id)
      select ('e5000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid
        from generate_series(1, 150) n$$,
  'segue até 150 pessoas em 24 h'
);
select throws_ok(
  $$insert into public.seguidores (seguido_id) values ('e5000000-0000-0000-0000-000000000151')$$,
  '23514', null, 'a 151ª no mesmo dia é recusada'
);
reset role;

select * from finish();
rollback;
