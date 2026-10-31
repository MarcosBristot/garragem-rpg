-- Testes das fotos: dono, chave no prefixo certo, limite de 6, cascata.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('20000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('20000000-0000-0000-0000-00000000000a', 'ana_f', now(), 'v1'),
  ('20000000-0000-0000-0000-00000000000b', 'beto_f', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo) values
  ('c2000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-00000000000a', 'Marca', 'Modelo');
insert into public.registros (id, carro_id, dono_id, tipo, titulo, data) values
  ('d2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-00000000000a', 'manutencao', 'Teste', '2026-01-01');

-- --------------------------------------------------------------- Ana
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select lives_ok(
  $$update public.carros set foto_capa =
      'u/20000000-0000-0000-0000-00000000000a/c/c2000000-0000-0000-0000-000000000001/capa/f2000000-0000-0000-0000-000000000001'
    where id = 'c2000000-0000-0000-0000-000000000001'$$,
  'capa dentro do diretório do próprio carro'
);
select throws_ok(
  $$update public.carros set foto_capa =
      'u/20000000-0000-0000-0000-00000000000b/c/c2000000-0000-0000-0000-000000000001/capa/x'
    where id = 'c2000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'capa não pode apontar para arquivo de outro usuário'
);

select lives_ok(
  $$insert into public.fotos_registro (registro_id, chave, largura, altura)
    select 'd2000000-0000-0000-0000-000000000001',
           'u/20000000-0000-0000-0000-00000000000a/c/c2000000-0000-0000-0000-000000000001/r/d2000000-0000-0000-0000-000000000001/' || n,
           2048, 1365
      from generate_series(1, 6) n$$,
  'adiciona 6 fotos ao registro'
);
select throws_ok(
  $$insert into public.fotos_registro (registro_id, chave, largura, altura)
    values ('d2000000-0000-0000-0000-000000000001',
            'u/20000000-0000-0000-0000-00000000000a/c/c2000000-0000-0000-0000-000000000001/r/d2000000-0000-0000-0000-000000000001/7',
            100, 100)$$,
  '23514', null, 'a sétima foto é recusada'
);
select throws_ok(
  $$insert into public.fotos_registro (registro_id, chave, largura, altura)
    values ('d2000000-0000-0000-0000-000000000001', 'u/outra-pessoa/c/x', 100, 100)$$,
  '23514', null, 'chave fora do prefixo do dono é recusada'
);
reset role;

-- -------------------------------------------------------------- Beto
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select is((select count(*) from public.fotos_registro), 0::bigint, 'outro usuário não vê fotos alheias');
select throws_ok(
  $$insert into public.fotos_registro (registro_id, chave, largura, altura)
    values ('d2000000-0000-0000-0000-000000000001',
            'u/20000000-0000-0000-0000-00000000000b/c/qualquer', 100, 100)$$,
  '42501', null, 'outro usuário não põe foto em registro alheio'
);
reset role;

-- ----------------------------------------------------------- anônimo
set local role anon;
select is((select count(*) from public.fotos_registro), 0::bigint, 'anônimo não vê fotos');
reset role;

-- ------------------------------------------------------ view pública
-- Registro privado de carro privado: nada aparece.
set local role anon;
select is((select count(*) from public.fotos_publicas
            where registro_id = 'd2000000-0000-0000-0000-000000000001'),
          0::bigint, 'view pública esconde fotos de registro privado');
reset role;

update public.carros set publico = true where id = 'c2000000-0000-0000-0000-000000000001';
update public.registros set visibilidade = 'publico_sem_valor'
 where id = 'd2000000-0000-0000-0000-000000000001';
set local role anon;
select is((select count(*) from public.fotos_publicas
            where registro_id = 'd2000000-0000-0000-0000-000000000001'),
          6::bigint, 'registro público de carro público mostra as fotos');
select ok(
  not has_table_privilege('anon', 'public.fotos_publicas', 'INSERT, UPDATE, DELETE'),
  'view pública de fotos é só leitura'
);
reset role;

-- Excluir o registro leva as linhas das fotos junto.
delete from public.registros where id = 'd2000000-0000-0000-0000-000000000001';
select is(
  (select count(*) from public.fotos_registro where registro_id = 'd2000000-0000-0000-0000-000000000001'),
  0::bigint, 'fotos somem junto com o registro'
);

select * from finish();
rollback;
