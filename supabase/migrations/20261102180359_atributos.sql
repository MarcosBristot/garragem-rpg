-- Atributos do carro (Fase 4). Os números (0–100) são calculados no
-- servidor do app por funções puras e testadas (src/dominio/atributos.ts);
-- o banco só guarda os fatos e entrega os TOTAIS que entram na conta.

-- Fatos novos, todos opcionais e informados pelo dono.
alter table public.carros
  add column potencia_cv smallint check (potencia_cv between 1 and 2000);
alter table public.registros
  add column faca_voce_mesmo boolean not null default false;
alter table public.itens_registro
  add column reaproveitada boolean not null default false;

-- Ficha do carro: só contagens e datas, nunca o conteúdo dos registros.
-- Registros privados contam (decisão do dono do produto): ninguém precisa
-- expor o diário para ter atributos. Responde só para carro público ou
-- para o próprio dono; nos outros casos devolve null (sem dizer se existe).
create function public.ficha_do_carro(p_carro uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_carro public.carros%rowtype;
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  v_inicio date := v_hoje - interval '12 months';
  v_ultima record;
begin
  select * into v_carro from public.carros where id = p_carro;
  -- Sem login, auth.uid() é null e "dono_id = null" dá NULL (não false):
  -- sem o coalesce, "not (false or null)" também é NULL e o if não barra.
  if not found
     or not (v_carro.publico or coalesce(v_carro.dono_id = (select auth.uid()), false)) then
    return null;
  end if;

  select r.data, r.km into v_ultima
    from public.registros r
   where r.carro_id = p_carro and r.tipo = 'manutencao'
   order by r.data desc, r.km desc nulls last
   limit 1;

  return jsonb_build_object(
    'potencia_cv', v_carro.potencia_cv,
    -- Modificações com ao menos uma peça no espaço "motor".
    'mods_motor', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.tipo = 'modificacao'
         and exists (select 1 from public.itens_registro i
                      where i.registro_id = r.id and i.espaco = 'motor')),
    -- Pessoas diferentes que curtiram posts do carro (uma vez cada).
    'curtidores', (
      select count(distinct c.perfil_id) from public.curtidas c
        join public.posts p on p.id = c.post_id
       where p.carro_id = p_carro),
    -- "Fiz eu mesmo" com prova (item ou foto).
    'diy_com_prova', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.faca_voce_mesmo
         and (exists (select 1 from public.itens_registro i where i.registro_id = r.id)
              or exists (select 1 from public.fotos_registro f where f.registro_id = r.id))),
    'reaproveitadas', (
      select count(*) from public.itens_registro i
        join public.registros r on r.id = i.registro_id
       where r.carro_id = p_carro and i.reaproveitada),
    'meses_ativos_12m', (
      select count(distinct date_trunc('month', r.data)) from public.registros r
       where r.carro_id = p_carro and r.data > v_inicio and r.data <= v_hoje),
    'registros_12m', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.data > v_inicio and r.data <= v_hoje),
    -- Completo = tem km e tem item ou foto.
    'completos_12m', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.data > v_inicio and r.data <= v_hoje
         and r.km is not null
         and (exists (select 1 from public.itens_registro i where i.registro_id = r.id)
              or exists (select 1 from public.fotos_registro f where f.registro_id = r.id))),
    'xp', (
      select coalesce(sum(e.pontos), 0) from public.eventos_xp e
       where e.carro_id = p_carro),
    'ultima_manutencao', v_ultima.data,
    'km_ultima_manutencao', v_ultima.km,
    'km_atual', (
      select max(r.km) from public.registros r where r.carro_id = p_carro)
  );
end;
$$;

revoke execute on function public.ficha_do_carro(uuid) from public;
grant execute on function public.ficha_do_carro(uuid) to anon, authenticated;
