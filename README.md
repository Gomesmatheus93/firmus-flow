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
