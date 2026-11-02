-- Ficha do carro: só para carro público ou para o dono; conta registros
-- privados sem expor conteúdo; curtidores distintos; "fiz eu mesmo" só com
-- prova; modificações de motor; dinheiro não entra.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('90000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('90000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('90000000-0000-0000-0000-00000000000c', 'caio@exemplo.test');
insert into public.perfis (id, nome_usuario, termos_aceitos_em, versao_termos) values
  ('90000000-0000-0000-0000-00000000000a', 'ana_ficha', now(), 'v1'),
  ('90000000-0000-0000-0000-00000000000b', 'beto_ficha', now(), 'v1'),
  ('90000000-0000-0000-0000-00000000000c', 'caio_ficha', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo, publico, potencia_cv) values
  ('c9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-00000000000a', 'Marca', 'Público', true, 120),
  ('c9000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-00000000000a', 'Marca', 'Privado', false, 90);

-- Registros (um privado), feitos como a dona
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.registros (id, carro_id, tipo, titulo, data, km, faca_voce_mesmo, visibilidade) values
  ('d9000000-0000-0000-0000-000000000001', 'c9000000-0000-0000-0000-000000000001', 'modificacao', 'Admissão', current_date - 10, 50000, true, 'privado'),
  ('d9000000-0000-0000-0000-000000000002', 'c9000000-0000-0000-0000-000000000001', 'manutencao', 'Óleo', current_date - 40, 49000, true, 'publico'),
  ('d9000000-0000-0000-0000-000000000003', 'c9000000-0000-0000-0000-000000000001', 'modificacao', 'Rodas', current_date - 70, null, false, 'publico');
insert into public.itens_registro (registro_id, descricao, categoria, espaco, valor_centavos, reaproveitada) values
  ('d9000000-0000-0000-0000-000000000001', 'Filtro esportivo', 'peca', 'motor', 9999999, true),
  ('d9000000-0000-0000-0000-000000000003', 'Rodas aro 15', 'peca', 'rodas', 100, true);
insert into public.posts (id, carro_id) values
  ('e9000000-0000-0000-0000-000000000001', 'c9000000-0000-0000-0000-000000000001'),
  ('e9000000-0000-0000-0000-000000000002', 'c9000000-0000-0000-0000-000000000001');
reset role;
insert into public.curtidas (post_id, perfil_id) values
  ('e9000000-0000-0000-0000-000000000001', '90000000-0000-0000-0000-00000000000b'),
  ('e9000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-00000000000b'),
  ('e9000000-0000-0000-0000-000000000002', '90000000-0000-0000-0000-00000000000c');

-- Visitante sem conta lê a ficha do carro público (limpa a sessão da Ana:
-- senão auth.uid() continuaria sendo ela dentro desta transação)
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
create temporary table ficha as
  select public.ficha_do_carro('c9000000-0000-0000-0000-000000000001') as f;
select is((select (f->>'potencia_cv')::int from ficha), 120, 'potência de fábrica informada');
select is((select (f->>'mods_motor')::int from ficha), 1, 'conta modificação com peça no motor (inclusive privada)');
select is((select (f->>'curtidores')::int from ficha), 2, 'curtidores distintos: quem curte 2 posts conta 1 vez');
select is((select (f->>'diy_com_prova')::int from ficha), 1, '"fiz eu mesmo" só conta com item ou foto');
select is((select (f->>'reaproveitadas')::int from ficha), 2, 'peças reaproveitadas, sem olhar valor');
select is((select (f->>'meses_ativos_12m')::int from ficha) between 2 and 3, true, 'meses com registro nos últimos 12');
select is((select (f->>'completos_12m')::int from ficha), 1, 'completo = km + (item ou foto)');
select ok((select f ? 'xp' from ficha), 'traz o XP total');
select ok(
  (select not (f::text ilike '%Admissão%' or f::text ilike '%Filtro%' or f::text like '%9999999%') from ficha),
  'não expõe títulos, itens nem valores'
);
select is(
  public.ficha_do_carro('c9000000-0000-0000-0000-000000000002'), null,
  'carro privado: visitante não recebe nada'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select isnt(
  public.ficha_do_carro('c9000000-0000-0000-0000-000000000002'), null,
  'dona recebe a ficha do próprio carro privado'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is(
  public.ficha_do_carro('c9000000-0000-0000-0000-000000000002'), null,
  'outra pessoa não recebe a ficha de carro privado'
);
reset role;

select * from finish();
rollback;
