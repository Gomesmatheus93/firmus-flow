import Anthropic from '@anthropic-ai/sdk'
import { createDb } from '@firmus/db'
import { createApp, createUnconfiguredApp } from './app'
import { createSupabaseVerifier } from './auth/supabase'
import { env, missingBackendConfig } from './env'
import {
  createSupabaseRemover,
  createSupabaseSigner,
  createSupabaseUploader,
} from './storage/supabase'

export type ServerOptions = {
  /** Quantas conexões com o banco. Na Vercel cada instância usa poucas. */
  maxConnections?: number
  /**
   * Como manter vivo um trabalho que continua depois da resposta. No servidor
   * de sempre o processo não morre; na Vercel a função seria desligada.
   */
  runInBackground?: (trabalho: Promise<unknown>) => void
}

/**
 * Monta a api a partir do .env. É a mesma montagem para os dois jeitos de
 * rodar: o servidor de sempre (`index.ts`, que chama `listen`) e a função da
 * Vercel (`vercel.ts`, que só exporta a api).
 */
export function buildServer(opcoes: ServerOptions = {}) {
  const missing = missingBackendConfig()

  /**
   * Cliente da Anthropic, ou `null` quando não há credencial — aí as rotas de
   * agente devolvem 503 com instrução e o resto da plataforma funciona.
   *
   * A checagem é nossa, e não do SDK, porque **o construtor do SDK não reclama
   * de credencial faltando**: ele constrói numa boa e só falha na primeira
   * chamada, com erro de autenticação. Se a gente confiasse nele, o 503 honesto
   * ("preencha a chave") viraria um 500 no meio do trabalho.
   *
   * Além da ANTHROPIC_API_KEY o SDK também aceita ANTHROPIC_AUTH_TOKEN, então
   * as duas valem aqui.
   */
  const aiClient =
    env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
      ? new Anthropic(env.ANTHROPIC_API_KEY ? { apiKey: env.ANTHROPIC_API_KEY } : {})
      : null

  // Sem a chave de administrador o Storage fica desligado: as peças aparecem
  // sem imagem e o envio de logo avisa o que falta. O resto funciona.
  const storage =
    env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
      ? ([env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_STORAGE_BUCKET] as const)
      : null

  const app =
    missing.length > 0
      ? createUnconfiguredApp(env.WEB_BASE_URL, missing)
      : createApp({
          db: createDb(env.DATABASE_URL!, opcoes.maxConnections),
          verifyToken: createSupabaseVerifier(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!),
          webBaseUrl: env.WEB_BASE_URL,
          aiClient,
          signAssetUrls: storage ? createSupabaseSigner(...storage) : null,
          removeAssets: storage ? createSupabaseRemover(...storage) : null,
          uploadAsset: storage ? createSupabaseUploader(...storage) : null,
          ...(opcoes.runInBackground ? { runInBackground: opcoes.runInBackground } : {}),
        })

  return { app, missing, aiClient }
}
