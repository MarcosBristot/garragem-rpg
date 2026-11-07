-- Foto de perfil (pedido do dono do produto: a foto é o principal; o
-- boneco vira um extra). Pública como o resto do perfil. O banco guarda só
-- a CHAVE do arquivo, sempre dentro da pasta da própria pessoa
-- (u/<id>/perfil/…): excluir a conta já apaga o arquivo com a pasta.

alter table public.perfis
  add column foto text check (
    foto is null
    or foto like 'u/' || id::text || '/perfil/%'
  );

-- Cada um só edita a própria linha (política "perfis: edita o próprio");
-- aqui só liberamos a coluna nova para UPDATE.
grant update (foto) on public.perfis to authenticated;
