# Publicar o ambiente de teste (staging)

Objetivo: um endereço na internet para testar no celular (fotos, login,
card), sem custo. Escolhas (nov/2026):

| Peça          | Onde                                      | Custo                      |
| ------------- | ----------------------------------------- | -------------------------- |
| Site          | Vercel Hobby, conectado ao GitHub         | grátis (uso não comercial) |
| Banco e login | Supabase Free, região São Paulo           | grátis                     |
| Fotos         | Storage do mesmo projeto Supabase, via S3 | grátis até 1 GB            |

Trocar as fotos para o Cloudflare R2 depois = só mudar as variáveis
`ARMAZENAMENTO_*` na Vercel (o código fala S3 com os dois).

## Limites do plano grátis (confira antes de lançar)

- **Vercel Hobby:** só uso não comercial. No lançamento: plano Pro (US$ 20/mês) ou outra hospedagem.
- **Vercel:** cada requisição tem no máximo 4,5 MB. Por isso fotos têm limite de 4 MB (`src/lib/fotos/limites.ts`) e o navegador as reduz antes.
- **Supabase Free:** o projeto pausa após 1 semana sem uso (os dados ficam; reative no painel); 500 MB de banco e 1 GB de arquivos.
- **E-mail do Supabase sem SMTP próprio:** só entrega para e-mails da equipe do projeto e com limite baixo por hora. Para você testar sozinho, basta. Para chamar outras pessoas: configurar SMTP próprio (ex.: Resend ou Brevo, plano grátis) — fica para depois.

## 1. Supabase na nuvem (você, ~10 min)

1. Em supabase.com, crie o projeto `garagem-rpg-staging`, região **South America (São Paulo)**. Guarde a senha do banco num gerenciador de senhas.
2. No terminal, na pasta do projeto:
   - `npx supabase login` (abre o navegador)
   - `npx supabase link --project-ref <REF>` (o REF está na URL do painel; pede a senha do banco)
   - `npx supabase db push` (aplica todas as migrações de `supabase/migrations`)
   - `npx supabase seed buckets --linked` (cria o bucket privado `fotos`)
3. No painel, **Authentication → URL Configuration**:
   - Site URL: a URL da Vercel (passo 3), ex. `https://garagem-rpg-staging.vercel.app`
   - Redirect URLs: `https://garagem-rpg-staging.vercel.app/**`
4. **Authentication → Emails → Templates**: nos modelos _Confirm signup_ e _Magic link_, cole o conteúdo de `supabase/templates/codigo.html` (o login é por código de 6 dígitos, `{{ .Token }}`). Assunto: "Seu código da Garagem RPG".
5. **Storage → S3** (configurações do Storage): copie o _Endpoint_ e a _Region_ e crie uma _Access key_. A chave secreta aparece uma vez só: vai direto para a Vercel, nunca para o Git nem para o chat.
6. **Project Settings → API Keys**: copie a URL do projeto e a _publishable key_ (a `secret`/`service_role` não é usada pelo app).

## 2. Vercel (você, ~5 min)

1. Em vercel.com, entre com o GitHub e importe `MarcosBristot/garragem-rpg`. Nome do projeto: `garagem-rpg-staging`.
2. Antes de publicar, em **Environment Variables**:

   | Variável                               | Valor                                   |
   | -------------------------------------- | --------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`             | URL do projeto (passo 1.6)              |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key (passo 1.6)             |
   | `ARMAZENAMENTO_ENDPOINT`               | Endpoint S3 (passo 1.5)                 |
   | `ARMAZENAMENTO_REGIAO`                 | Region (passo 1.5)                      |
   | `ARMAZENAMENTO_CHAVE_ID`               | Access key id (passo 1.5)               |
   | `ARMAZENAMENTO_CHAVE_SECRETA`          | Secret (passo 1.5) — marque _Sensitive_ |
   | `ARMAZENAMENTO_BUCKET`                 | `fotos`                                 |
   | `ARMAZENAMENTO_PATH_STYLE`             | `true`                                  |

   Não defina `PERMITIR_INDEXACAO`: sem ela o site responde `noindex` (fora do Google).

3. Deploy. Depois, em **Settings → Functions**, se o plano permitir, escolha a região **São Paulo (gru1)**: o servidor fica perto do banco e cada página carrega mais rápido.

## 3. Rotina depois de publicado

- Todo `git push` na `main` publica sozinho na Vercel.
- **Migração nova:** rode `npx supabase db push` ANTES de enviar o código que depende dela (senão o site novo procura colunas que ainda não existem).
- Fotos e dados de teste lá são seus; não use dados de outras pessoas sem consentimento (as páginas legais ainda são rascunho).
