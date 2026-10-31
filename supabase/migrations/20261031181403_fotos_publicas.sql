-- Fotos visíveis ao público: só as de registros que já aparecem em
-- registros_publicos (registro não privado de carro público). Segue o
-- mesmo modelo das outras views públicas: colunas escolhidas a dedo.
create view public.fotos_publicas
with (security_invoker = false, security_barrier = true) as
select f.id, f.registro_id, f.chave, f.descricao, f.largura, f.altura, f.criado_em
  from public.fotos_registro f
  join public.registros_publicos r on r.id = f.registro_id;

revoke all on public.fotos_publicas from anon, authenticated;
grant select on public.fotos_publicas to anon, authenticated;
