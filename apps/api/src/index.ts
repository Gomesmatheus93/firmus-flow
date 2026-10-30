import { createDb } from '@firmus/db'
import { createApp, createUnconfiguredApp } from './app'
import { createSupabaseVerifier } from './auth/supabase'
import { env, missingBackendConfig } from './env'

const missing = missingBackendConfig()

const app =
  missing.length > 0
    ? createUnconfiguredApp(env.WEB_BASE_URL, missing)
    : createApp({
        db: createDb(env.DATABASE_URL!),
        verifyToken: createSupabaseVerifier(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!),
        webBaseUrl: env.WEB_BASE_URL,
      })

app.listen(env.API_PORT, () => {
  console.log(`[api] Firmus Flow rodando em http://localhost:${env.API_PORT}`)

  if (missing.length > 0) {
    console.warn(
      `[api] Faltam variáveis no .env da raiz: ${missing.join(', ')}.\n` +
        '      Só GET /health funciona até você preenchê-las.',
    )
  }
})
