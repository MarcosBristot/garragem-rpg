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
- Ambiente de teste (Vercel + Supabase na nuvem): passo a passo em `docs/publicar-teste.md`. Migração nova: `npx supabase db push --linked` ANTES do push do código. Fotos até 4 MB (teto de 4,5 MB por requisição da Vercel).

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
- **Ligas:** comparação só entre carros da mesma classe (`carros.classe`: hatch, sedã, SUV, picape, esportivo, clássico com 25+ anos), escolhida pelo dono. Sem classe = fora do ranking. Ranking = XP ganho no mês (dia de São Paulo), zera todo dia 1º.
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

**Fase atual:** 3 e 4 em paralelo. Feito: Fase 1; Fase 2 sem custo (OS à mão); Condição; XP e nível; personagem 3D; feed (posts, seguir, bloquear, curtidas, comentários, denúncias); atributos e ficha pública; equipamento; conquistas. Ranking por liga e cidade (liga = classe escolhida pelo dono; pontuação = XP do mês). Perfil com foto, seguir pela página Pessoas, notificações, recompensa de XP. Fase 5 (MVP): encontros no mapa. Próximo: sequência (streak), lembretes de manutenção, locais fixos no mapa. Leitura de OS por IA só com aprovação de custo do usuário.

## Identidade visual

Tema claro, de dia: campo de flores (lavanda, azul e branco) sob céu com nuvens. Fundo `#F6F5FB`, superfícies `#FFFFFF` / `#EEECF7`, bordas decorativas `#DEDAEE`, bordas de campo `#837E98` (3:1), texto `#1C1A26`, secundário `#4C485C`, apagado `#625E74`, destaque violeta `#5B3FD0` (texto branco por cima), Condição verde `#167A3D`, erro `#B42318` (`text-erro`, nunca `red-*`), céu `#9DBBE0` (só fundos). Fonte única das cores: tokens em `globals.css` + `src/lib/paleta.ts` (para next/og, SVG e 3D); um teste confere que batem e que os contrastes passam. Fundos de identidade pelos utilitários `fundo-ceu` (capas) e `fundo-vitrine` (carro sem foto, boneco): nada de `bg-[radial-gradient(...)]` solto. Títulos (h1/h2) em Instrument Serif (só peso 400 — nunca `font-bold`), texto em Geist, rótulos com a utilidade `rotulo` (caixa alta espaçada). Ambas OFL. Componentes acessíveis (contraste mínimo 4.5:1 em texto e 3:1 em contornos de campo, alvos de toque de 44 px, elementos semânticos, foco visível, link "Pular para o conteúdo" mirando `<main id="conteudo">`).

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
- Landing (`src/app/page.tsx`): estática. Fundo = sequência de 48 quadros renderizados no Blender (`SequenciaCarro`: 1º quadro em `<picture>`, os demais num `<canvas>` escolhidos pela rolagem; lógica pura e testada em `sequencia.ts`; com menos movimento fica só o 1º quadro). Textos em cartões claros translúcidos ao redor do carro (`Revelar`). Pipeline em `ferramentas/landing/` (README): carro em código (`carroceria.ts`, testado, desenho próprio) → OBJ + desenho técnico em 4 vistas (`desenho.ts`, testado; vincos, faróis, lanternas projetados por triplanar) → `cena_campo.py` (peças por raycast, interior, flores, árvores, HDRI) → `renderizar-tudo.sh` (Cycles na CPU, ~3,5 h) → `converter-quadros.mjs` (WebP em `public/landing/campo/`). Modelos de terceiros ficam fora do Git e entram SÓ como render; registrar origem, autor e licença em `docs/creditos.md`. Carro de marca real nunca. RX 580 (4 GB): não roda Cycles; no Eevee (testes) sem raytracing e sem névoa volumétrica (quadros brancos/pretos). Cache do dev com CSS velho? Apague `.next/dev` e reinicie.
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
- Equipamento: derivado dos itens com `espaco` (`montarEquipamento` em `src/dominio/equipamento.ts`, a peça mais recente de cada espaço). Dono usa todos os registros; ficha pública usa só `itens_publicos`. Falhas de servidor vão ao log por `registrarFalha` (`src/lib/log.ts`): só etapa e código, nunca dados da pessoa.
- Ranking: `public.ranking_mensal(classe, cidade)` (security definer, só `authenticated`; só TOTAIS de XP do mês de carros públicos com classe; respeita `bloqueio_entre`). Cidade comparada por `private.chave_cidade` (sem acento, sem UF no fim). Classes em `src/dominio/classe.ts` (um teste compara com o CHECK da migração); filtros da URL em `src/dominio/ranking.ts`.
- E-mail do login: SMTP do Gmail do projeto no teste (Resend sem domínio só entrega para a própria conta); passo a passo em `docs/publicar-teste.md`.
- Perfil: `/conta` mostra a pessoa (números, posts, carros); formulários em `/conta/configuracoes` (aceiteOpcional: baixar dados e excluir sem aceitar termos novos). Foto de perfil em `perfis.foto` (chave em `u/<id>/perfil/`, CHECK no banco); `AvatarPerfil` = foto ou rosto do personagem. Login e aceite de termos levam ao `/feed`.
- Notificações: sem tabela; `minhas_notificacoes()` / `notificacoes_novas()` (security invoker: RLS e bloqueios valem) derivam de curtidas, comentários e seguidores; `perfis.notificacoes_vistas_em`. Agrupamento em `src/dominio/notificacoes.ts`. Sino no layout da área logada (dentro de Suspense).
- Recompensa de XP: criar registro redireciona com `?novo=1`; a página lê o ganho dos `eventos_xp` (nunca da URL) e usa `recompensaDoRegistro` (`src/dominio/xp.ts`). Animações (`animate-pulo`, `animate-encher`, `animate-confete` em globals.css) sempre com `motion-safe:`.
- Seguir: limite de 150 por 24 h (gatilho); página `/pessoas` (busca com `termoBusca`, que limpa o texto antes do filtro `.or()` do PostgREST).
- Mapa (Fase 5): `encontros` + `presencas` (só quem tem conta vê; bloqueios valem; de quem vai, só o número via `resumo_encontros`; início no futuro e até 6 meses, no máximo 72 h de duração e 5 por dia, por gatilho). Lat/lng numéricos (PostGIS só quando precisar de "perto de mim"). Validação em `src/dominio/encontro.ts` (horário de SP, -03:00 fixo). MapLibre GL 6.16.0 (versão fixa) + OpenFreeMap (`src/lib/mapa.ts`); o worker é servido de `public/mapa/` (um teste confere a versão; atualizou o pacote? copie `dist/maplibre-gl-worker.mjs` de novo). Componente só no navegador (`MapaVer` / `dynamic(..., { ssr: false })`); balões montados com `textContent` (nada de HTML do banco). Nunca pedir geolocalização (Permissions-Policy bloqueia).
- Conquistas: derivadas (somem se os dados somem), regras em `src/dominio/conquistas.ts` sobre os totais da `ficha_do_carro`. Ficha pública mostra só as desbloqueadas, sem progresso. A `ficha_do_carro` expõe TOTAIS (ex.: quantos registros) de carros públicos a qualquer um pela API: nunca acrescente nela conteúdo, valores ou datas de registros privados além dos já existentes.
- Novo script de terceiros, cookie ou armazenamento local? Antes: consentimento (se não for essencial) e linha na tabela de `/cookies`.

## Next.js

@AGENTS.md
