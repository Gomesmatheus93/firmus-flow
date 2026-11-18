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

  // Chave de administrador. Hoje só o Storage usa: o bucket é privado, e é
  // com ela que a api gera os links temporários das imagens. A validação de
  // token continua com a chave pública. Sem ela, as peças aparecem sem imagem.
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  SUPABASE_STORAGE_BUCKET: z.string().default('brand-assets'),

  // Sem a chave, a plataforma abre e tudo funciona menos os agentes: as rotas
  // que chamam IA devolvem 503 dizendo o que falta. Não entra em
  // missingBackendConfig de propósito — falta de IA não derruba a api inteira.
  ANTHROPIC_API_KEY: optionalText,
  ANTHROPIC_MODEL: optionalText,
})

/**
 * A URL e a chave pública do Supabase são as mesmas para a api e para a web, e
 * as duas são públicas. A web só enxerga o nome com VITE_; aceitar os dois
 * nomes aqui evita cadastrar o mesmo valor duas vezes no painel da Vercel —
 * e a api parar de autenticar quando só o nome com VITE_ existe.
 */
const doPainel = (nome: string) => process.env[nome]?.trim() || process.env[`VITE_${nome}`]?.trim()

const parsed = envSchema.safeParse({
  ...process.env,
  SUPABASE_URL: doPainel('SUPABASE_URL'),
  SUPABASE_ANON_KEY: doPainel('SUPABASE_ANON_KEY'),
})

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
