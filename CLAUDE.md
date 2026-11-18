# Firmus Flow — instruções do projeto

Este arquivo é lido pelo Claude Code em toda sessão. Siga estas regras sempre.

## O que é o Firmus Flow

Plataforma SaaS da **Firmus Tech** (Mossoró/RN) usada pelo próprio dono de negócio
e pela equipe dele. Ela entende a marca da empresa, faz uma auditoria do Instagram e do
atendimento, gera conteúdo com a identidade da marca e atende os clientes da empresa
no WhatsApp com IA.

### Fluxo da plataforma (em ordem)

1. **Landing page**: vendas, FAQ e auditoria grátis (isca de captação).
2. **Onboarding de marca**: o chefe cadastra o contexto da empresa (serviços, público,
   diferenciais, tom de voz), as cores, o logo e o Instagram.
3. **Agentes e auditoria**: os agentes estudam a empresa, geram a auditoria do Instagram
   e do atendimento e salvam o que aprenderam no Cérebro da Marca.
4. **Gerações**: planejamento semanal ou mensal, carrossel, post único, legendas.
   O chefe aprova e o conteúdo é baixado para publicar no Meta Business Suite.
5. **Atendente de IA no WhatsApp**: responde, coleta leads e passa para um humano.
6. **Publicação**: programador de postagem e automação de comentários.
7. **Analytics**: métricas do perfil do Instagram, dia a dia.

### Cérebro da Marca (conceito central)

Toda empresa tem um único "Cérebro da Marca": um registro estruturado com tudo que a
plataforma sabe sobre ela (contexto, tom de voz, paleta, logo, público, ofertas,
perguntas frequentes, achados da auditoria). **Todos os agentes leem dele.** Nenhum
agente guarda conhecimento da marca em outro lugar.

### Papéis e permissões

- Cada **empresa** (tenant) tem usuários com papel `chefe` ou `funcionario`.
- `chefe`: configura a marca, aprova conteúdo, configura o WhatsApp, convida e remove
  funcionários, e faz tudo o que o funcionário faz.
- `funcionario`: vê a auditoria, gera conteúdo (que fica aguardando aprovação) e
  assume conversas do WhatsApp passadas para humano.
- **Isolamento total entre empresas**: toda tabela de dados de cliente tem
  `company_id`, e toda consulta filtra por ele no servidor. Nunca confiar em
  `company_id` vindo do navegador; sempre derivar da sessão do usuário.

## Stack

| Parte             | Tecnologia                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------- |
| Monorepo          | pnpm workspaces                                                                               |
| Backend           | Node.js 20+, TypeScript, Express, Zod para validação                                          |
| Banco             | PostgreSQL no Supabase, Drizzle ORM e migrations do Drizzle                                   |
| Login             | Supabase Auth (e-mail e senha, convite por e-mail)                                            |
| Fila e jobs       | BullMQ + Redis                                                                                |
| IA                | SDK oficial da Anthropic (`@anthropic-ai/sdk`). Modelos configurados por variável de ambiente |
| Frontend          | React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query                              |
| Imagens dos posts | Templates HTML/SVG renderizados em PNG com Playwright                                         |
| WhatsApp          | WhatsApp Cloud API oficial da Meta (direto, sem intermediário)                                |
| Testes            | Vitest                                                                                        |
| Deploy            | Docker na VPS própria com EasyPanel ou Coolify                                                |

### Estrutura de pastas

```
apps/
  api/        # Express: rotas REST, webhooks, auth middleware
  worker/     # BullMQ: jobs de IA, renderização de imagens, mensagens do WhatsApp
  web/        # React: painel do cliente e landing page
packages/
  db/         # schema Drizzle, migrations, cliente do banco
  agents/     # runtime dos agentes, prompts, ferramentas
  shared/     # tipos e schemas Zod compartilhados
third_party/
  instagram-agent-skill/   # skills públicas MIT de Jake Schincariol (manter LICENSE)
```

## Agentes

Cada agente fica em `packages/agents/src/<nome>/` com:

- `prompt.md`: instruções do agente, em português
- `index.ts`: função que monta o contexto (Cérebro da Marca + entrada), chama a IA e
  valida a saída com Zod
- `index.test.ts`: testes com a chamada da IA simulada (mock)

Agentes do MVP: `marca` (monta o Cérebro da Marca), `auditoria`, `estrategista`
(planejamento), `conteudo` (legendas, roteiros e textos de carrossel), `design` (aplica a
marca nos templates), `atendimento` (WhatsApp) e `tendencias` (o ig-viral).

O agente `referencia` lê a imagem que o chefe envia em "Enviar template" (Cérebro da
Marca) e tira dela um guia de estilo, guardado em `brand_style_references`. O runtime
junta esses guias ao Cérebro, então **todo agente** segue o estilo sem pedir. O guia
descreve o estilo, nunca o conteúdo de quem fez a referência.

O agente `tendencias` **pesquisa na web**: a API do Instagram não entrega dado sobre
perfis de terceiros. Ele sempre guarda a fonte de cada achado, e a tela só mostra o que
tem fonte. É leitura de tendência, nunca número oficial do Instagram.

As skills em `third_party/instagram-agent-skill/skills/ig-*` são **material de referência**
que os prompts podem incorporar ou carregar. Elas são MIT: manter o arquivo LICENSE e os
créditos em `third_party/README.md`. Os scripts Python delas (ex.: `ig-human`) devem ser
portados para TypeScript quando forem usados.

Toda saída de agente é JSON validado por um schema Zod antes de ser salva.

## Regras inegociáveis

1. **Nada de código, prompt, documento ou dado vindo do emprego do Matheus.** Só código
   escrito neste repositório ou de fontes públicas com licença permissiva (MIT, Apache 2.0,
   BSD), com a licença preservada. Na dúvida, pergunte antes de usar.
2. **Segredos só em `.env`** (nunca commitados). Manter `.env.example` atualizado, sem
   valores reais.
3. **Isolamento entre empresas** em toda rota, job e consulta (ver Papéis).
4. **Webhooks validados**: verificar a assinatura `X-Hub-Signature-256` da Meta.
5. **LGPD**: guardar só o necessário das conversas; nunca registrar mensagens completas em logs.
6. **Publicar automaticamente depende da Meta.** O programador de postagem e a automação
   de comentários existem na plataforma, mas só agem de verdade com o app aprovado na
   revisão da Meta (`instagram_content_publish` e `instagram_manage_comments`;
   `instagram_manage_insights` para o Analytics). Enquanto não houver aprovação, a
   plataforma guarda a configuração, avisa na tela o que falta e **não publica nada**.

## Como trabalhar neste projeto

O Matheus está aprendendo a programar enquanto constrói. Por isso:

1. **Planeje antes de codar.** Para cada tarefa, mostre o plano (arquivos que vai criar ou
   alterar e por quê) e espere o OK antes de executar.
2. **Uma tarefa por vez**, pequena e testável.
3. **Rode os testes e o typecheck** antes de dizer que terminou.
4. **Explique no final**, em português simples: o que foi feito, como funciona e como
   testar manualmente. Explique conceitos novos quando aparecerem.
5. **Commits pequenos**, no formato `tipo: descrição` (ex.: `feat: cadastro de empresa`).
6. **Pergunte quando houver dúvida** de produto. Não invente regra de negócio.

## Dados na interface

**Nenhuma tela inventa dado.** Toda tela busca na api e mostra um estado vazio honesto
quando não há nada — nunca conteúdo de exemplo. O componente `AsyncState` trata
carregando, erro e vazio num lugar só.

Enquanto o Supabase não estiver no `.env`, a plataforma entra em **modo demonstração**:
uma sessão de vitrine (`src/lib/demo-session.ts`) só para a casca abrir, com um aviso no
topo. Isso é sessão, não conteúdo.

## Convenções

- Código, nomes de arquivos, variáveis e tabelas em **inglês**. Textos da interface,
  prompts dos agentes e mensagens ao usuário em **português do Brasil**.
- TypeScript estrito (`strict: true`), sem `any`.
- Datas em UTC no banco; exibir no fuso `America/Sao_Paulo`.
- Valores em reais armazenados em centavos (inteiro).

## Identidade visual da plataforma

Paleta oficial, extraída dos arquivos do logo em `Documents/firmus tech/logo`:

| Nome        | Hex       | Uso                                       |
| ----------- | --------- | ----------------------------------------- |
| Azul Firmus | `#1C8CFF` | cor principal: o que é clicável e o ativo |
| Ciano       | `#22C3E6` | destaque, no máximo uma vez por tela      |
| Azul noite  | `#0B1F3A` | títulos e blocos de assinatura            |
| Grafite     | `#1A1D23` | corpo de texto                            |
| Ardósia     | `#5A6B82` | texto secundário                          |
| Gelo        | `#F4F7FB` | fundo de bloco interno, campo, linha      |
| Fundo       | `#F3F6FB` | fundo da página                           |
| Régua       | `#E6ECF4` | bordas e divisórias                       |
| Lateral     | `#0A1A33` | só a barra lateral                        |

**Estilo SaaS moderno** (aprovado pelo Matheus em 18/11/2026, a partir de quatro
referências de dashboards SaaS). A plataforma é clara, com a cor da Firmus:

1. **Barra lateral azul-noite** de cima a baixo, ícone + nome, item ativo numa pílula
   Azul Firmus. Quem está logado fica no topo, à direita, com o menu de perfil.
2. **Fundo chapado** (`fundo`) e **cartões brancos sólidos** (utilidade `surface`, ou o
   componente `Panel`): canto de 18px, sombra suave, sem borda dura. Nada de vidro fosco
   nem desfoque.
3. **Cartão de métrica** (`StatStrip`): ícone num quadradinho azul claro (`icon-chip`),
   rótulo, número grande `tabular`. No máximo um cartão `accent` por tela, preenchido.
4. **Bloco de destaque** (`FeatureBlock`, utilidade `highlight`): degradê do Azul Firmus
   ao azul-noite. **No máximo um por tela**, senão deixa de ser destaque.
5. **Selo de variação** ("+12%") só com comparação real. Busca e notificações só quando
   existirem de verdade: controle que não responde parece defeito.
6. Tabela com a classe `data-table` (vira ficha no celular); listas de navegação em
   linhas com `icon-chip` e seta.

**Exceção: a tela de Analytics** (decisão do Matheus, 02/11/2026). Ela segue uma
referência própria: cabeçalho do perfil com faixa pastel, cartão de Score de
Engajamento e cartões de métrica com ícone em degradê colorido e um tom pastel no
canto. Os tons vivem num lugar só, em `apps/web/src/components/analytics/blocks.tsx`.
A exceção vale só para essa tela.

- Fontes: Michroma só na assinatura "FIRMUS FLOW"; Inter em todo o resto.
- O logo de verdade está em `apps/web/src/assets/firmus-symbol.png`, recortado do kit.
  Dentro do painel quem assina é o produto ("FIRMUS FLOW"), não a empresa
  ("FIRMUS TECH").
- As cores vivem em `apps/web/src/index.css`: o bloco `@theme` define a paleta e os
  tokens do shadcn/ui apontam para ela. Mude lá, nunca nos componentes.

## Comandos

- `pnpm install`: instala tudo
- `pnpm dev`: sobe api (3333), worker e web (5173) em modo desenvolvimento
- `pnpm build`: compila tudo para produção
- `pnpm test`: roda os testes (Vitest)
- `pnpm typecheck`: confere os tipos
- `pnpm lint` / `pnpm format`: ESLint e Prettier
- `pnpm db:generate` / `pnpm db:migrate`: migrations do Drizzle

Os pacotes de `packages/` não têm passo de build próprio: eles exportam
`./src/index.ts` direto, e quem traduz o TypeScript é o `tsx` (dev) ou o `tsup` (build
dos apps). Ao criar um pacote novo, siga esse mesmo padrão.
