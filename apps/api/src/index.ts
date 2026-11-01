import Anthropic from '@anthropic-ai/sdk'
import { createDb } from '@firmus/db'
import { createApp, createUnconfiguredApp } from './app'
import { createSupabaseVerifier } from './auth/supabase'
import { env, missingBackendConfig } from './env'

const missing = missingBackendConfig()

// Sem chave fica null, e as rotas de agente devolvem 503 com instrução. O
// construtor do SDK estoura quando não acha chave nenhuma, então nem chamamos.
const aiClient = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY }) : null

const app =
  missing.length > 0
    ? createUnconfiguredApp(env.WEB_BASE_URL, missing)
    : createApp({
        db: createDb(env.DATABASE_URL!),
        verifyToken: createSupabaseVerifier(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!),
        webBaseUrl: env.WEB_BASE_URL,
        aiClient,
      })

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
      '[api] ANTHROPIC_API_KEY não preenchida: os agentes devolvem 503 até você preenchê-la.',
    )
  }
})
