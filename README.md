# Firmus Flow

Plataforma da **Firmus Tech**: entende a marca do cliente, audita o Instagram e o
atendimento, gera conteúdo com a identidade da marca e atende no WhatsApp com IA.

As regras do projeto estão no [CLAUDE.md](./CLAUDE.md).

## Como rodar

Você precisa de **Node 20+** e **pnpm 10+**.

```bash
pnpm install          # instala as dependências de todos os pacotes
cp .env.example .env  # no Windows: copy .env.example .env
pnpm dev              # sobe api, worker e web ao mesmo tempo
```

Depois disso:

- API: <http://localhost:3333/health> deve responder `{"ok":true}`
- Web: <http://localhost:5173>

## Comandos

| Comando            | O que faz                                      |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Sobe api, worker e web em modo desenvolvimento |
| `pnpm build`       | Compila todos os pacotes para produção         |
| `pnpm test`        | Roda os testes (Vitest)                        |
| `pnpm typecheck`   | Confere os tipos do TypeScript                 |
| `pnpm lint`        | Roda o ESLint                                  |
| `pnpm format`      | Formata o código com o Prettier                |
| `pnpm db:generate` | Gera uma migration a partir do schema Drizzle  |
| `pnpm db:migrate`  | Aplica as migrations no banco                  |

## Ligar o Supabase (login e banco de verdade)

Enquanto o `.env` não tiver as variáveis do Supabase, a plataforma roda em
**modo demonstração**: entra direto, com dados de exemplo, e um aviso aparece no
topo. Para ligar de verdade:

### 1. Crie o projeto

Em <https://supabase.com>, crie um projeto. Guarde a senha do banco: ela aparece
uma vez só.

### 2. Copie as chaves

Em **Project Settings → API**:

| No painel do Supabase   | No `.env`                                      |
| ----------------------- | ---------------------------------------------- |
| Project URL             | `SUPABASE_URL` e `VITE_SUPABASE_URL`           |
| `anon` `public`         | `SUPABASE_ANON_KEY` e `VITE_SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY`                    |

A `service_role` ignora todas as permissões do banco. Ela fica **só no servidor**
— nunca numa variável `VITE_`, porque essas vão para o navegador.

Em **Project Settings → Database → Connection string → URI**, copie para
`DATABASE_URL` e troque `[YOUR-PASSWORD]` pela senha do passo 1.

### 3. Crie as tabelas

```bash
pnpm db:migrate
```

### 4. Ajuste a confirmação de e-mail

Em **Authentication → Providers → Email**, decida se quer exigir confirmação por
e-mail. Durante o desenvolvimento é mais prático desligar: sem isso, cada conta
nova precisa clicar num link antes de entrar.

### 5. Reinicie

```bash
pnpm dev
```

O aviso de demonstração some e o login passa a valer. O primeiro cadastro cria a
conta, a tela seguinte cria a empresa e você vira o chefe dela.

### Convidar funcionários

Em **Equipe → Convidar funcionário**, informe o e-mail. Ainda não enviamos
e-mail automático: a plataforma devolve um link para você mandar à pessoa. Ela
cria a conta com aquele e-mail, abre o link e entra como funcionário.

## Estrutura

```
apps/
  api/        Express: rotas REST, webhooks, autenticação
  worker/     BullMQ: jobs de IA, imagens e WhatsApp
  web/        React + Vite: painel e landing page
packages/
  db/         Schema Drizzle, migrations e cliente do banco
  agents/     Runtime dos agentes de IA e seus prompts
  shared/     Tipos e schemas Zod usados por mais de um app
third_party/  Código de terceiros (licença preservada)
```

Os pacotes de `packages/` são consumidos direto do TypeScript (sem passo de build
entre eles). Quem traduz o TypeScript é o `tsx` em desenvolvimento e o `tsup` no build.
