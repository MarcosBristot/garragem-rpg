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

**Fase atual:** 1 — garagem e diário. Feito: repositório, visibilidade, schema + RLS, login, perfil, carros, registros e itens. Em andamento: nova identidade visual (Geist + Instrument Serif), landing com carro 3D e páginas legais/LGPD.

## Identidade visual

Tema escuro: fundo `#121316`, superfícies `#1B1D22`, bordas `#2A2D34`, texto `#ECEDEF`, texto secundário `#A3A7B0`, destaque âmbar `#F5A524`, Condição verde `#4ADE80`. Títulos em Chakra Petch, texto em Inter. Componentes acessíveis (contraste mínimo 4.5:1, alvos de toque de 44 px, elementos semânticos).

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
- `cacheComponents` está ligado: componente que lê sessão ou cookies fica dentro de `<Suspense>`; o resto da página vira casca estática.
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

## Next.js

@AGENTS.md
