-- Ranking por liga e cidade (Fase 4). Decisões do dono do produto:
-- - liga = classe do carro, escolhida pelo dono (hatch, sedã, SUV, picape,
--   esportivo, clássico). Sem classe, o carro não entra no ranking;
-- - pontuação = XP ganho no mês corrente (dia de São Paulo), que zera todo
--   dia 1º. XP só vem de cuidar do carro: dinheiro nunca entra.
-- A função devolve só TOTAIS de carros públicos (como a ficha_do_carro) e
-- só para quem tem conta; quem bloqueou ou foi bloqueado não aparece.

alter table public.carros
  add column classe text check (
    classe in ('hatch', 'seda', 'suv', 'picape', 'esportivo', 'classico')
  );

-- Cidade em texto livre: "São Paulo", "sao paulo - SP" e "Sao Paulo/SP"
-- viram a mesma chave (minúsculas, sem acento, sem a UF no fim).
create function private.chave_cidade(p_cidade text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        lower(translate(
          btrim(p_cidade),
          'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
          'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
        )),
        '\s*[-/,]\s*[a-z]{2}$', ''
      ),
      '\s+', ' ', 'g'
    ),
    ''
  );
$$;

create function public.ranking_mensal(
  p_classe text,
  p_cidade text default null,
  p_limite integer default 50
)
returns table (
  posicao integer,
  carro_id uuid,
  apelido text,
  marca text,
  modelo text,
  ano smallint,
  nome_usuario text,
  cidade text,
  xp_mes integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_eu uuid := (select auth.uid());
  -- Início do mês no relógio de São Paulo, como o limite diário de XP.
  v_inicio timestamptz :=
    date_trunc('month', now() at time zone 'America/Sao_Paulo')
      at time zone 'America/Sao_Paulo';
  v_chave text := private.chave_cidade(p_cidade);
begin
  -- Só para quem tem conta (a página fica na área logada).
  if v_eu is null then
    return;
  end if;

  return query
  with pontos as (
    select e.carro_id, sum(e.pontos)::integer as xp
      from public.eventos_xp e
     where e.criado_em >= v_inicio
     group by e.carro_id
  )
  select
    (rank() over (order by p.xp desc))::integer,
    c.id, c.apelido, c.marca, c.modelo, c.ano,
    pf.nome_usuario, pf.cidade, p.xp
  from pontos p
  join public.carros c on c.id = p.carro_id
  join public.perfis pf on pf.id = c.dono_id
  where c.publico
    and c.classe = p_classe
    and (v_chave is null or private.chave_cidade(pf.cidade) = v_chave)
    and not private.bloqueio_entre(v_eu, c.dono_id)
  order by p.xp desc, c.criado_em
  limit least(greatest(coalesce(p_limite, 50), 1), 100);
end;
$$;

revoke execute on function public.ranking_mensal(text, text, integer) from public, anon;
grant execute on function public.ranking_mensal(text, text, integer) to authenticated;
