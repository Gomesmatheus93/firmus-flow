import { loadRootEnv } from '@firmus/shared/env'
import { z } from 'zod'

loadRootEnv()

/** No .env, uma variável não preenchida vira string vazia. Tratamos como ausente. */
const optionalText = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  WEB_BASE_URL: z.url().default('http://localhost:5173'),

  // Opcionais no schema para a api subir antes do Supabase existir.
  // Sem elas, só /health responde; o resto devolve 503 com instrução.
  DATABASE_URL: optionalText,
  SUPABASE_URL: optionalText,
  SUPABASE_ANON_KEY: optionalText,

  // Só para operações de administrador, que ainda não existem. A validação de
  // token usa a chave pública.
  SUPABASE_SERVICE_ROLE_KEY: optionalText,

  // Sem a chave, a plataforma abre e tudo funciona menos os agentes: as rotas
  // que chamam IA devolvem 503 dizendo o que falta. Não entra em
  // missingBackendConfig de propósito — falta de IA não derruba a api inteira.
  ANTHROPIC_API_KEY: optionalText,
  ANTHROPIC_MODEL: optionalText,
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas na api:')
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data

/** Variáveis que faltam para a api funcionar por completo. Vazio = tudo certo. */
export function missingBackendConfig(): string[] {
  const missing: string[] = []
  if (!env.DATABASE_URL) missing.push('DATABASE_URL')
  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!env.SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY')
  return missing
}
