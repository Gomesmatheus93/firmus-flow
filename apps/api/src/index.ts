import { env } from './env'
import { buildServer } from './server'

/** O servidor de sempre: no computador (`pnpm dev`) e, depois, no Docker da VPS. */
const { app, missing, aiClient } = buildServer()

app.listen(env.API_PORT, () => {
  console.log(`[api] Firmus Flow rodando em http://localhost:${env.API_PORT}`)

  if (missing.length > 0) {
    console.warn(
      `[api] Faltam variáveis no .env da raiz: ${missing.join(', ')}.\n` +
        '      Só GET /health funciona até você preenchê-las.',
    )
  }

  if (!aiClient) {
    console.warn(
      '[api] Sem credencial da Anthropic: os agentes devolvem 503. ' +
        'Preencha ANTHROPIC_API_KEY no .env da raiz.',
    )
  }
})
