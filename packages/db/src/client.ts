import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Cria o cliente do banco. `prepare: false` é exigido pelo pooler do Supabase.
 *
 * `maxConnections`: o padrão do driver (10) serve para o servidor de sempre.
 * Numa função da Vercel, que sobe várias cópias, cada uma deve usar poucas.
 */
export function createDb(databaseUrl: string, maxConnections?: number) {
  const client = postgres(databaseUrl, {
    prepare: false,
    ...(maxConnections ? { max: maxConnections } : {}),
  })
  return drizzle(client, { schema, casing: 'snake_case' })
}
