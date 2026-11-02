-- Conquistas (Fase 4): derivadas dos dados, como nível e atributos. Se a
-- pessoa apaga os registros que deram uma conquista, ela some (decisão do
-- dono do produto: sem tabela nova e sem como "farmar" criando e apagando).
-- Aqui a ficha só ganha mais TOTAIS; as regras ficam em
-- src/dominio/conquistas.ts. Mesmas garantias: só carro público ou dono.

create or replace function public.ficha_do_carro(p_carro uuid)
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
      select max(r.km) from public.registros r where r.carro_id = p_carro),
    -- Totais das conquistas (src/dominio/conquistas.ts).
    'registros_total', (
      select count(*) from public.registros r where r.carro_id = p_carro),
    'manutencoes_total', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.tipo = 'manutencao'),
    'completos_total', (
      select count(*) from public.registros r
       where r.carro_id = p_carro and r.km is not null
         and (exists (select 1 from public.itens_registro i where i.registro_id = r.id)
              or exists (select 1 from public.fotos_registro f where f.registro_id = r.id))),
    'primeiro_registro', (
      select min(r.data) from public.registros r where r.carro_id = p_carro),
    'ultimo_registro', (
      select max(r.data) from public.registros r where r.carro_id = p_carro),
    -- Só posts com foto (os que aparecem no feed).
    'posts_total', (
      select count(*) from public.posts p
       where p.carro_id = p_carro
         and exists (select 1 from public.fotos_post f where f.post_id = p.id)),
    'espacos_ocupados', (
      select count(distinct i.espaco) from public.itens_registro i
        join public.registros r on r.id = i.registro_id
       where r.carro_id = p_carro and i.espaco is not null)
  );
end;
$$;
