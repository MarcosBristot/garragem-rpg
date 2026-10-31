-- OS: só o dono vê e mexe; uma por registro; foto no prefixo do dono;
-- nunca pública, nem com carro e registro públicos.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('40000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('40000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('40000000-0000-0000-0000-00000000000a', 'ana_os', now(), 'v1'),
  ('40000000-0000-0000-0000-00000000000b', 'beto_os', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo, publico) values
  ('c4000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-00000000000a', 'Marca', 'Modelo', true);
insert into public.registros (id, carro_id, dono_id, tipo, titulo, data, visibilidade) values
  ('d4000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-00000000000a', 'manutencao', 'Teste', '2026-01-01', 'publico');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.ordens_servico (registro_id, foto_chave, oficina, total_centavos)
    values ('d4000000-0000-0000-0000-000000000001',
            'u/40000000-0000-0000-0000-00000000000a/c/c4000000-0000-0000-0000-000000000001/r/d4000000-0000-0000-0000-000000000001/os/x',
            'Oficina Fictícia', 45000)$$,
  'dona anexa a OS ao registro'
);
select throws_ok(
  $$insert into public.ordens_servico (registro_id) values ('d4000000-0000-0000-0000-000000000001')$$,
  '23505', null, 'uma OS por registro'
);
select throws_ok(
  $$update public.ordens_servico set foto_chave = 'u/40000000-0000-0000-0000-00000000000b/c/x'$$,
  '23514', null, 'foto da OS não aponta para arquivo de outro usuário'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*) from public.ordens_servico), 0::bigint, 'outro usuário não vê a OS');
reset role;

set local role anon;
select is((select count(*) from public.ordens_servico), 0::bigint, 'anônimo não vê a OS, mesmo com carro e registro públicos');
select is(
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name like '%_publicos' and column_name like '%total_centavos%'),
  0::bigint, 'nenhuma view pública expõe dados da OS'
);
reset role;

delete from public.registros where id = 'd4000000-0000-0000-0000-000000000001';
select is((select count(*) from public.ordens_servico), 0::bigint, 'OS some junto com o registro');

select * from finish();
rollback;
