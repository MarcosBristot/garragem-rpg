# Garagem RPG — contexto de desenvolvimento

Garagem RPG (nome provisório) é uma aplicação web para entusiastas de carros: um diário de manutenção do veículo que vira ficha de RPG, com feed de fotos, mapa de encontros e cards compartilháveis. Sou o único desenvolvedor, trabalhando em paralelo ao emprego (~[8–10] h/semana). Prioridade: entregar valor em passos pequenos, com custo baixo e código testado.

## Stack

- **Frontend:** Next.js + TypeScript, renderização no servidor para páginas públicas. PWA instalável. App nativo (React Native/Expo) só depois do MVP.
- **Backend e banco:** Supabase (Postgres, Auth, Storage, Realtime) + PostGIS para o mapa.
- **Imagens:** armazenamento sem taxa de saída (Cloudflare R2 ou equivalente) + CDN. Redimensionar no upload (miniatura, feed, tela cheia) em WebP/AVIF.
- **Mapa:** MapLibre + OpenStreetMap.
- **IA:** modelo com visão para extrair dados de ordens de serviço em JSON estruturado, sempre com confirmação do usuário.
- **Pagamentos (fase posterior):** gateway brasileiro com Pix e assinatura.

Proponha outra tecnologia só com motivo forte, explicando o custo da troca.

## Comandos

- Instalar: `npm install`
- Rodar local: `npm run dev` (http://localhost:3000)
- Testes: `npm test` (modo watch: `npm run test:watch`)
- Lint/format: `npm run lint`, `npm run typecheck`, `npm run format`
- Supabase local (precisa do Docker Desktop aberto): `npx supabase start` / `npx supabase stop`
- Migrações: `npx supabase migration new <nome>`; aplicar do zero: `npx supabase db reset`
- Testes de RLS (pgTAP): `npx supabase test db`
- Bucket local de fotos (depois de `supabase start` num banco novo): `npx supabase seed buckets --local`
- Ambiente de teste (Vercel + Supabase na nuvem): passo a passo em `docs/publicar-teste.md`. Migração nova: `npx supabase db push` ANTES do push do código. Fotos até 4 MB (teto de 4,5 MB por requisição da Vercel).

## Modelo de dados

- `usuarios` → `carros` (1:N) → `registros` (manutenções e modificações) → `itens_registro` (peça ou mão de obra, categoria, quantidade, valor, espaço de equipamento)
- `ordens_servico` (oficina, data, km, total, foto original, visibilidade), ligadas a `registros`
- `leituras_km`, `historico_edicoes`
- `posts` → `comentarios`, `curtidas`; `seguidores`
- `eventos_xp` → nível, atributos e conquistas são derivados deles
- `locais`, `encontros` (coordenada, tipo, data, expiração)
- `denuncias`, `bloqueios`

## Regras de domínio

- **Visibilidade por registro:** `privado`, `publico_sem_valor`, `publico`. Valores e documentos são privados por padrão.
- **Atributos do carro:** Potência (specs + mods de motor), Estilo (votos), Engenhosidade (faça você mesmo, peças reaproveitadas), Dedicação (frequência e qualidade dos registros), Condição.
- **Condição (0–100):** cai com tempo e km desde a última manutenção relevante; sobe ao registrar serviço. Deve ser uma função pura e testada.
- **Equipamento:** espaços motor, suspensão, rodas, freios, estética, som.
- **Ligas:** comparação só entre carros da mesma faixa de valor FIPE ou classe.
- **Dinheiro gasto nunca gera pontos diretamente.**
- **Histórico de edições:** todo registro guarda quando foi criado e cada edição posterior (base do relatório de revenda).

## Regras inegociáveis

1. **Localização:** nunca guardar nem exibir onde o carro fica. Perfil mostra só a cidade. Remover EXIF/GPS de toda foto no upload. Sem localização em tempo real.
2. **Privacidade (LGPD):** OS e notas podem conter CPF e endereço — privadas por padrão, nunca em páginas públicas, nunca em logs. Excluir conta remove os dados.
3. **Segurança:** RLS em todas as tabelas. Nenhuma regra de visibilidade só no frontend. Links de relatório com token e expiração. Segredos só em variáveis de ambiente.
4. **Jogo justo:** XP, atributos e Condição calculados só no servidor, com limite diário de XP por tipo de ação.
5. **Moderação:** denunciar e bloquear existem desde que houver conteúdo de outros usuários.
6. **Propriedade intelectual:** nada de logotipos, personagens ou artes de terceiros.
7. **Custo:** avisar antes de qualquer escolha que gere custo mensal acima de [R$ 100].

## Fases do MVP

1. Garagem e diário: contas, carros, registros com fotos e visibilidade, página pública com Open Graph dinâmico, card 9:16 para stories.
2. Leitura de OS: upload, extração por IA, tela de revisão, histórico de edições.
3. Social: feed, seguir, curtir, comentar, denunciar, bloquear.
4. RPG: XP, níveis, atributos, Condição, equipamento, conquistas, ranking por liga e cidade.
5. Mapa: encontros e locais.

Fora do MVP: marketplace, chat privado, vídeos, integração com oficinas, app nativo.

**Fase atual:** 3 e 4 em paralelo. Feito: Fase 1; Fase 2 sem custo (OS à mão); Condição; XP e nível; personagem 3D; feed (posts, seguir, bloquear, curtidas, comentários, denúncias); atributos e ficha pública. Próximo: equipamento, conquistas, ranking por liga e cidade. Leitura de OS por IA só com aprovação de custo do usuário.

## Identidade visual

Tema escuro inspirado em estúdios automotivos: fundo `#0B0B0D`, superfícies `#16171B` / `#1E1F24`, bordas decorativas `#2A2C33`, bordas de campo `#6B6F79` (3:1), texto `#ECEDEF`, secundário `#A3A7B0`, apagado `#8A8F99`, destaque âmbar `#F5A524`, Condição verde `#4ADE80`. Títulos (h1/h2) em Instrument Serif (só peso 400 — nunca `font-bold`), texto em Geist, rótulos com a utilidade `rotulo` (caixa alta espaçada). Ambas OFL. Componentes acessíveis (contraste mínimo 4.5:1 em texto e 3:1 em contornos de campo, alvos de toque de 44 px, elementos semânticos, foco visível, link "Pular para o conteúdo" mirando `<main id="conteudo">`).

## Como trabalhar comigo

- Antes de algo grande, mostre um plano curto: arquivos afetados, decisões e riscos. Pergunte antes de decisões caras de desfazer (schema, autenticação, provedores).
- Prefira o menor passo que entrega valor e pode ser testado.
- Escreva testes junto com a lógica de domínio (XP, atributos, Condição, visibilidade, RLS).
- Explique decisões de arquitetura de forma didática — quero aprender.
- Commits pequenos e mensagens claras. Nada de dados reais em seeds ou testes.
- Não invente APIs ou bibliotecas; se não tiver certeza, diga e verifique.
- Ao fim de cada tarefa: o que foi feito, o que falta e o próximo passo.
- Responda em português.

## Convenções do código

- Sessão no servidor: `usuarioLogado()` / `exigirPerfil()` em `src/lib/sessao.ts` (usam `getClaims()`, nunca `getSession()`).
- `cacheComponents` está ligado: componente que lê sessão ou cookies fica dentro de `<Suspense>`; o resto da página vira casca estática. `usePathname` também suspende em rotas com `[id]`.
- Área logada fica no grupo `src/app/(app)` (menu do topo + barra inferior no celular).
- Formulários: Server Action + `useActionState`; a ação devolve os valores digitados (o React limpa o form após o envio).
- Tipos do banco: `npm run db:tipos` depois de cada migração.
- Telas do dono filtram por `dono_id`: a RLS também libera linhas públicas de outras pessoas.
- Ids da URL passam por `ehUuid()`; "não existe" e "não é seu" dão o mesmo 404.
- Mutação: Server Action confere a sessão, depois `revalidatePath` + `redirect`.
- Datas do diário são só dia (AAAA-MM-DD): use `hojeEmSaoPaulo()` e `formatarData()` de `src/lib/datas.ts`, nunca `new Date(texto)` para exibir.
- Listas de opções: `Object.hasOwn`, não `in` (evita aceitar "toString").
- `logging.serverFunctions: false` no next.config: argumentos de Server Actions (notas) não vão para o log.
- Arquivos `"use server"` só exportam funções async (tipos podem); constantes ficam em outro arquivo.
- Formulário com `<select>`: recriar com `key` a cada resposta da ação (o reset do React 19 volta o select ao padrão).
- Dinheiro: `reaisParaCentavos` / `formatarReais` em `src/dominio/dinheiro.ts`; nunca float.
- Testes pgTAP filtram pelos dados fictícios deles: o banco local pode ter outros dados.
- Landing (`src/app/page.tsx`): estática; o 3D (`src/components/landing/`) carrega com `dynamic(..., { ssr: false })`. Carro modelado em código em `carro-3d.tsx` (trocável por .glb licenciado); trajetória da câmera em `trajetoria.ts` (testada). Iluminação só com `Lightformer` (presets do drei baixam arquivos de terceiros).
- Honestidade na landing: sem depoimentos, números ou avaliações inventadas; o que não existe leva selo "Em breve"/"Exemplo".
- SVG reutilizável não usa `id` interno (colide quando há várias cópias na página).
- Estilos de elemento (body, h1, h2) ficam em `@layer base`: fora de camada eles venceriam as utilitárias do Tailwind.
- Legal/LGPD: dados da empresa e provedores em `src/lib/empresa.ts` (páginas legais mostram "Rascunho" enquanto houver `[preencher`). Mudou o tratamento de dados? Atualize `/privacidade`, `/cookies` e `VERSAO_TERMOS`.
- Perfil só é criado com aceite (`termos_aceitos_em` + `versao_termos`), exigido pela RLS. Mudou `VERSAO_TERMOS`? Atualize `MUDANCAS_TERMOS`: `exigirPerfil()` manda quem tem versão antiga para `/termos-atualizados` (a Conta fica livre, com `aceiteOpcional`); o novo aceite passa pela função `aceitar_termos()`. Exclusão de conta pela função `excluir_minha_conta()`; exportação em `/conta/dados`.
- Fotos: `src/lib/fotos/` — `processar.ts` (sharp: remove EXIF/GPS, 3 tamanhos WebP; testado), `chaves.ts` (caminhos `u/<usuário>/c/<carro>/…`), `armazenamento.ts` (S3: R2 em produção, Supabase local em dev; bucket privado, URLs assinadas de 1 h). Banco guarda a chave, nunca a URL. Excluiu carro/registro/conta? Apague também o prefixo no armazenamento.
- Páginas públicas (`/c/[id]`, `/u/[usuario]`, card, OG) leem SEMPRE pelo `clientePublico()` (anônimo, sem cookies) via `src/lib/publico.ts`: assim o dono não vê dado privado na própria página pública. Imagens geradas (`next/og`) recebem fotos como data URL (`fotoParaImagem`), nunca por URL.
- Denúncias: só INSERT pela API (RLS); moderação pelo painel do Supabase por enquanto.
- Ordem de serviço (`ordens_servico`): sempre privada, nunca em view pública, card ou OG; foto em `u/…/r/<registro>/os/`. IA para ler OS: não fazer chamadas pagas sem aprovação explícita do usuário (ele pediu custo zero no início).
- RPG: `src/dominio/condicao.ts` (função pura, testada; intervalos em constantes). Condição, XP e atributos só calculados no servidor.
- XP: tabela `eventos_xp` gravada SÓ por triggers (`private.conceder_xp`, limite diário no dia de São Paulo; apagar a origem apaga o XP). Pontos em `private.regra_xp()` e espelhados em `REGRAS_XP` (`src/dominio/xp.ts`; um teste compara com a migração). Nível = `nivelDoXp(soma)`, nunca guardado.
- Personagem: `perfis.personagem` (jsonb, só chaves; público como o perfil). Opções e validação em `src/dominio/personagem.ts`; vazio = `personagemPadrao(id)`. 3D em `src/components/personagem/` (`Boneco`, carregado só no navegador; `AvatarPersonagem` é o 2D leve para listas). Hooks próprios começam com `use` (ex.: `useMenosMovimento`).
- Feed: `posts` + `fotos_post` (até 4; chave `u/…/c/<carro>/p/<post>/`), `seguidores`, `bloqueios`. Post só em carro próprio e público; quem vê é decidido pela RLS (carro público + sem bloqueio nos dois sentidos via `private.bloqueio_entre`, única função do schema `private` executável por `authenticated`). Fotos sobem uma por requisição (limite da Vercel). Seguir/bloquear em `src/app/(app)/pessoas-acoes.ts`. Não rode `npm run build` com o dev server ligado: os dois usam `.next` e o dev pode ficar com módulo velho (reinicie o dev).
- Curtidas (uma por pessoa, nunca no próprio post) e comentários (autor ou dono do post apagam). Embeds de `perfis` a partir de `posts` usam a FK nomeada (`perfis!posts_dono_id_fkey`): `curtidas` cria um caminho muitos-para-muitos e deixa o embed ambíguo. Consultas do feed lançam erro em vez de devolver lista vazia.
- Atributos: `public.ficha_do_carro(carro)` (security definer) devolve só TOTAIS, e só para carro público ou dono; cálculo em `src/dominio/atributos.ts` (constantes ajustáveis, testado) via `src/lib/ficha.ts`. Registros privados contam (só o número aparece). Em plpgsql, compare com `auth.uid()` usando `coalesce(..., false)`: sem login ele é null e `not (x or null)` não barra. Nos testes pgTAP, limpe `request.jwt.claims` antes de testar como anon.
- Novo script de terceiros, cookie ou armazenamento local? Antes: consentimento (se não for essencial) e linha na tabela de `/cookies`.

## Next.js

@AGENTS.md
