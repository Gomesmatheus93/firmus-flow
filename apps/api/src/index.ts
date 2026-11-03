import Anthropic from '@anthropic-ai/sdk'
import { createDb } from '@firmus/db'
import { createApp, createUnconfiguredApp } from './app'
import { createSupabaseVerifier } from './auth/supabase'
import { env, missingBackendConfig } from './env'
import { createSupabaseSigner } from './storage/supabase'

const missing = missingBackendConfig()

/**
 * Cliente da Anthropic, ou `null` quando não há credencial — aí as rotas de
 * agente devolvem 503 com instrução e o resto da plataforma funciona.
 *
 * A checagem é nossa, e não do SDK, porque **o construtor do SDK não reclama
 * de credencial faltando**: ele constrói numa boa e só falha na primeira
 * chamada, com erro de autenticação. Conferi. Se a gente confiasse nele, o 503
 * honesto ("preencha a chave") viraria um 500 no meio do trabalho.
 *
 * Além da ANTHROPIC_API_KEY o SDK também aceita ANTHROPIC_AUTH_TOKEN, então as
 * duas valem aqui. Quem usa perfil do `ant auth login` vai cair no 503 — é o
 * erro certo para errar: diz o que fazer, em vez de confundir.
 */
const aiClient =
  env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    ? new Anthropic(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : {})
    : null

/** Sem a chave de administrador as peças aparecem sem imagem; o resto funciona. */
const signAssetUrls =
  env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseSigner(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        env.SUPABASE_STORAGE_BUCKET,
      )
    : null

const app =
  missing.length > 0
    ? createUnconfiguredApp(env.WEB_BASE_URL, missing)
    : createApp({
        db: createDb(env.DATABASE_URL!),
        verifyToken: createSupabaseVerifier(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!),
        webBaseUrl: env.WEB_BASE_URL,
        aiClient,
        signAssetUrls,
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
      '[api] Sem credencial da Anthropic: os agentes devolvem 503. ' +
        'Preencha ANTHROPIC_API_KEY no .env da raiz.',
    )
  }
})
