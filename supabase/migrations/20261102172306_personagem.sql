-- Personagem 3D de blocos: só as escolhas (chaves curtas), público como o
-- resto do perfil. Vazio = boneco padrão gerado do id (src/dominio/personagem.ts).
-- O app valida cada chave; o banco garante formato e tamanho.
alter table public.perfis
  add column personagem jsonb
  check (
    personagem is null
    or (jsonb_typeof(personagem) = 'object' and pg_column_size(personagem) <= 512)
  );

-- UPDATE em perfis é por coluna (ver aceite_termos_e_excluir_conta).
grant update (personagem) on public.perfis to authenticated;
