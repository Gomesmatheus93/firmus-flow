import { loadRootEnv } from '@firmus/shared/env'
import { z } from 'zod'

loadRootEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.url().default('redis://localhost:6379'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas no worker:')
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
