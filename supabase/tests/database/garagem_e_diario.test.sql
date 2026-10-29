-- Testes de RLS e regras da fase 1. Rodar: npx supabase test db
-- Dados 100% fictícios. Tudo roda numa transação desfeita no fim.
-- Contagens filtram pelos dados da Ana: o banco local pode ter outros dados.
--
-- IDs fixos para ler os testes com facilidade:
--   Ana (dona) ...0a   Beto (outro usuário) ...0b
--   carro público c...01, carro privado c...02
--   registros d...01 privado | d...02 publico_sem_valor | d...03 publico
--             d...04 publico, mas no carro privado
--   itens e...0N pertencem ao registro d...0N, todos com 18000 centavos
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

-- ------------------------------------------------------------- estrutura
select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'RLS ligada em todas as tabelas de public'
);
select hasnt_column('public', 'registros_publicos', 'notas', 'view pública não tem notas');

-- --------------------------------------------- cenário (como postgres)
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('00000000-0000-0000-0000-00000000000b', 'beto@exemplo.test');
insert into public.perfis (id, nome_usuario, cidade) values
  ('00000000-0000-0000-0000-00000000000a', 'ana', 'Cidade Fictícia'),
  ('00000000-0000-0000-0000-00000000000b', 'beto', 'Outra Cidade');
insert into public.carros (id, dono_id, marca, modelo, publico) values
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Marca', 'Público', true),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'Marca', 'Privado', false);
insert into public.registros (id, carro_id, dono_id, tipo, titulo, data, notas, visibilidade) values
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'manutencao', 'Privado', '2026-01-01', 'nota secreta', 'privado'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'manutencao', 'Sem valor', '2026-01-02', 'nota secreta', 'publico_sem_valor'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'modificacao', 'Público', '2026-01-03', 'nota secreta', 'publico'),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000a', 'manutencao', 'Carro privado', '2026-01-04', null, 'publico');
insert into public.itens_registro (id, registro_id, descricao, categoria, valor_centavos) values
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Peça', 'motor', 18000),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Peça', 'motor', 18000),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Peça', 'motor', 18000),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'Peça', 'motor', 18000);

-- ------------------------------------------------- visitante anônimo
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is((select count(*) from public.registros), 0::bigint, 'anon: não lê registros direto');
select is((select count(*) from public.itens_registro), 0::bigint, 'anon: não lê itens direto');
select is((select count(*) from public.carros where dono_id = '00000000-0000-0000-0000-00000000000a'), 1::bigint, 'anon: vê só o carro público');
select results_eq(
  $$select titulo from public.registros_publicos where dono_id = '00000000-0000-0000-0000-00000000000a' order by data$$,
  array['Sem valor', 'Público'],
  'anon: view mostra só registros não privados de carros públicos'
);
select is((select count(*) from public.itens_publicos where registro_id::text like 'd0000000-%'), 2::bigint, 'anon: itens só dos registros visíveis');
select is(
  (select valor_centavos from public.itens_publicos where registro_id = 'd0000000-0000-0000-0000-000000000002'),
  null::integer,
  'anon: publico_sem_valor esconde o valor'
);
select is(
  (select valor_centavos from public.itens_publicos where registro_id = 'd0000000-0000-0000-0000-000000000003'),
  18000,
  'anon: publico mostra o valor'
);
-- Testa a permissão em si: um INSERT na view falharia antes por ela não
-- ser atualizável (55000), escondendo se o GRANT está certo.
select ok(
  not has_table_privilege('anon', 'public.registros_publicos', 'INSERT, UPDATE, DELETE')
  and not has_table_privilege('anon', 'public.itens_publicos', 'INSERT, UPDATE, DELETE'),
  'anon: views públicas são só leitura'
);
select throws_ok(
  $$insert into public.carros (dono_id, marca, modelo) values ('00000000-0000-0000-0000-00000000000a', 'X', 'Y')$$,
  '42501', null, 'anon: não cria carro'
);
select is((select count(*) from public.historico_edicoes), 0::bigint, 'anon: não lê histórico');

reset role;

-- ------------------------------------------------------- Ana (dona)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select is((select count(*) from public.registros), 4::bigint, 'dona: vê todos os seus registros');
select is(
  (select notas from public.registros where id = 'd0000000-0000-0000-0000-000000000001'),
  'nota secreta',
  'dona: lê as próprias notas'
);

update public.registros set titulo = 'Público editado' where id = 'd0000000-0000-0000-0000-000000000003';
select is(
  (select antes ->> 'titulo' from public.historico_edicoes
    where registro_id = 'd0000000-0000-0000-0000-000000000003' and operacao = 'UPDATE'),
  'Público',
  'dona: edição gera histórico com o valor anterior'
);

insert into public.itens_registro (registro_id, descricao, categoria)
values ('d0000000-0000-0000-0000-000000000003', 'Mão de obra', 'servico');
select is(
  (select count(*) from public.historico_edicoes
    where tabela = 'itens_registro' and operacao = 'INSERT'
      and depois ->> 'descricao' = 'Mão de obra'),
  1::bigint,
  'dona: item novo gera histórico'
);

select throws_ok(
  'delete from public.historico_edicoes',
  '42501', null, 'dona: não apaga histórico'
);
select throws_ok(
  $$update public.historico_edicoes set antes = null$$,
  '42501', null, 'dona: não reescreve histórico'
);

select lives_ok(
  $$delete from public.registros where id = 'd0000000-0000-0000-0000-000000000002'$$,
  'dona: apaga registro com itens (cascata + trigger)'
);
select is(
  (select count(*) from public.historico_edicoes where registro_id = 'd0000000-0000-0000-0000-000000000002'),
  0::bigint,
  'dona: histórico de registro apagado some junto'
);

reset role;

-- --------------------------------------------------- Beto (outro usuário)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);

select is((select count(*) from public.registros), 0::bigint, 'outro: não vê registros alheios');
select is((select count(*) from public.carros where dono_id = '00000000-0000-0000-0000-00000000000a'), 1::bigint, 'outro: vê só o carro público alheio');
select throws_ok(
  $$insert into public.registros (carro_id, tipo, titulo, data)
    values ('c0000000-0000-0000-0000-000000000001', 'manutencao', 'invasão', '2026-02-01')$$,
  '23503', null, 'outro: não registra no carro alheio (FK composta)'
);
select throws_ok(
  $$insert into public.registros (carro_id, dono_id, tipo, titulo, data)
    values ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'manutencao', 'invasão', '2026-02-01')$$,
  '42501', null, 'outro: não se passa pelo dono'
);
with u as (
  update public.registros set titulo = 'hackeado'
   where id = 'd0000000-0000-0000-0000-000000000003' returning 1
)
select is(count(*), 0::bigint, 'outro: não edita registro alheio') from u;
select throws_ok(
  $$insert into public.itens_registro (registro_id, descricao, categoria)
    values ('d0000000-0000-0000-0000-000000000003', 'invasão', 'motor')$$,
  '42501', null, 'outro: não adiciona item em registro alheio'
);
with u as (
  update public.perfis set cidade = 'hackeada'
   where id = '00000000-0000-0000-0000-00000000000a' returning 1
)
select is(count(*), 0::bigint, 'outro: não edita perfil alheio') from u;
select is((select count(*) from public.historico_edicoes), 0::bigint, 'outro: não lê histórico alheio');

reset role;

-- ----------------------------------------- LGPD: excluir conta apaga tudo
delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
select is(
  (select (select count(*) from public.perfis where id = '00000000-0000-0000-0000-00000000000a')
        + (select count(*) from public.carros where dono_id = '00000000-0000-0000-0000-00000000000a')
        + (select count(*) from public.registros where dono_id = '00000000-0000-0000-0000-00000000000a')
        -- Só os itens dos registros da Ana: o banco local pode ter dados de
        -- outros usuários criados no navegador.
        + (select count(*) from public.itens_registro where registro_id in (
            'd0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002',
            'd0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004'))
        + (select count(*) from public.historico_edicoes where dono_id = '00000000-0000-0000-0000-00000000000a')),
  0::bigint,
  'excluir a conta remove perfil, carros, registros, itens e histórico'
);

select * from finish();
rollback;
