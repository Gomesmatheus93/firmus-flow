import { loadRootEnv } from '@firmus/shared'
import { z } from 'zod'

loadRootEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3333),
  WEB_BASE_URL: z.url().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas na api:')
  console.error(z.prettifyError(parsed.error))
  process.exit(1)
}

export const env = parsed.data
