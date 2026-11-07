-- Ranking mensal: liga = classe; XP só do mês; só carros públicos; cidade
-- comparada sem acento e sem UF; bloqueios somem; só para quem tem conta.
-- O banco local pode ter outros carros: as consultas filtram pelos dados
-- deste teste (ids cb10…, cidade fictícia "Vila Fictícia").
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('b1000000-0000-0000-0000-00000000000a', 'ana@exemplo.test'),
  ('b1000000-0000-0000-0000-00000000000b', 'beto@exemplo.test'),
  ('b1000000-0000-0000-0000-00000000000c', 'caio@exemplo.test'),
  ('b1000000-0000-0000-0000-00000000000d', 'duda@exemplo.test');
insert into public.perfis (id, nome_usuario, cidade, termos_aceitos_em, versao_termos) values
  ('b1000000-0000-0000-0000-00000000000a', 'ana_rank', 'Vila Fictícia', now(), 'v1'),
  ('b1000000-0000-0000-0000-00000000000b', 'beto_rank', 'vila ficticia - XX', now(), 'v1'),
  ('b1000000-0000-0000-0000-00000000000c', 'caio_rank', 'Vila Fictícia/XX', now(), 'v1'),
  ('b1000000-0000-0000-0000-00000000000d', 'duda_rank', 'Vila Fictícia', now(), 'v1');
insert into public.carros (id, dono_id, marca, modelo, publico, classe) values
  ('cb100000-0000-0000-0000-0000000000a1', 'b1000000-0000-0000-0000-00000000000a', 'Marca', 'Hatch da Ana', true, 'hatch'),
  ('cb100000-0000-0000-0000-0000000000a2', 'b1000000-0000-0000-0000-00000000000a', 'Marca', 'Sedã da Ana', true, 'seda'),
  ('cb100000-0000-0000-0000-0000000000b1', 'b1000000-0000-0000-0000-00000000000b', 'Marca', 'Hatch do Beto', true, 'hatch'),
  ('cb100000-0000-0000-0000-0000000000b2', 'b1000000-0000-0000-0000-00000000000b', 'Marca', 'Hatch privado', false, 'hatch'),
  ('cb100000-0000-0000-0000-0000000000c1', 'b1000000-0000-0000-0000-00000000000c', 'Marca', 'Hatch do Caio', true, 'hatch'),
  ('cb100000-0000-0000-0000-0000000000c2', 'b1000000-0000-0000-0000-00000000000c', 'Marca', 'Sem classe', true, null);

-- XP gravado pelos triggers, como no app (manutenção = 30, modificação = 20).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
insert into public.registros (carro_id, tipo, titulo, data) values
  ('cb100000-0000-0000-0000-0000000000a1', 'manutencao', 'A1', current_date),
  ('cb100000-0000-0000-0000-0000000000a1', 'manutencao', 'A2', current_date),
  ('cb100000-0000-0000-0000-0000000000a2', 'manutencao', 'A3', current_date);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
insert into public.registros (carro_id, tipo, titulo, data) values
  ('cb100000-0000-0000-0000-0000000000b1', 'manutencao', 'B1', current_date),
  ('cb100000-0000-0000-0000-0000000000b2', 'manutencao', 'B2', current_date);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
insert into public.registros (carro_id, tipo, titulo, data) values
  ('cb100000-0000-0000-0000-0000000000c1', 'manutencao', 'C1', current_date),
  ('cb100000-0000-0000-0000-0000000000c1', 'manutencao', 'C2', current_date),
  ('cb100000-0000-0000-0000-0000000000c1', 'manutencao', 'C3', current_date),
  ('cb100000-0000-0000-0000-0000000000c2', 'modificacao', 'C4', current_date);
reset role;
-- Um XP do Caio é do mês passado: não conta (90 → 60).
update public.eventos_xp set criado_em = date_trunc('month', now()) - interval '2 days'
 where id = (select min(id) from public.eventos_xp
              where carro_id = 'cb100000-0000-0000-0000-0000000000c1');
select set_config('request.jwt.claims', '', true);

select is(private.chave_cidade('  São   Paulo/SP '), 'sao paulo', 'cidade: sem acento, sem UF, espaços normais');

-- A Ana olha o ranking.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select results_eq(
  $$select modelo from public.ranking_mensal('hatch')
     where carro_id::text like 'cb100000%' order by posicao, modelo$$,
  array['Hatch da Ana', 'Hatch do Caio', 'Hatch do Beto'],
  'liga hatch no Brasil: só carros públicos com XP no mês'
);
select results_eq(
  $$select posicao from public.ranking_mensal('hatch', 'Vila Fictícia') order by posicao, modelo$$,
  array[1, 1, 3],
  'empate divide a posição (60 e 60), o próximo é o 3º'
);
select is(
  (select xp_mes from public.ranking_mensal('hatch') where modelo = 'Hatch do Caio'),
  60, 'XP do mês passado não conta'
);
select is(
  (select count(*) from public.ranking_mensal('hatch') where modelo = 'Hatch privado'),
  0::bigint, 'carro privado não entra'
);
select results_eq(
  $$select modelo from public.ranking_mensal('hatch', 'VILA FICTICIA - XX') order by modelo$$,
  array['Hatch da Ana', 'Hatch do Beto', 'Hatch do Caio'],
  'cidade: acento, maiúsculas e UF no fim não importam'
);
select is(
  (select count(*) from public.ranking_mensal('hatch', 'Outra Vila Fictícia')),
  0::bigint, 'outra cidade: ninguém do teste'
);
select results_eq(
  $$select modelo from public.ranking_mensal('seda') where carro_id::text like 'cb100000%'$$,
  array['Sedã da Ana'],
  'cada classe é uma liga'
);
select is(
  (select count(*) from public.ranking_mensal('esportivo') where carro_id::text like 'cb100000%'), 0::bigint,
  'liga sem carros: lista vazia'
);
reset role;

-- A Duda bloqueou o Beto: ele some do ranking dela.
insert into public.bloqueios (bloqueador_id, bloqueado_id) values
  ('b1000000-0000-0000-0000-00000000000d', 'b1000000-0000-0000-0000-00000000000b');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b1000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);
select is(
  (select count(*) from public.ranking_mensal('hatch') where modelo = 'Hatch do Beto'),
  0::bigint, 'bloqueio: quem bloqueou não vê o bloqueado'
);
reset role;
-- E o Beto também não vê a Duda (sentido contrário) — ela não tem carro,
-- então confere pela função auxiliar usada no filtro.
select ok(private.bloqueio_entre('b1000000-0000-0000-0000-00000000000b', 'b1000000-0000-0000-0000-00000000000d'),
  'bloqueio vale nos dois sentidos');

-- Sem conta: a função nem pode ser chamada.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select throws_ok(
  $$select * from public.ranking_mensal('hatch')$$,
  '42501', null, 'visitante sem conta não acessa o ranking'
);
reset role;

select * from finish();
rollback;
