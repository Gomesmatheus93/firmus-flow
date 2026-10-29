import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Cria o cliente do banco. `prepare: false` é exigido pelo pooler do Supabase.
 */
export function createDb(databaseUrl: string) {
  const client = postgres(databaseUrl, { prepare: false })
  return drizzle(client, { schema, casing: 'snake_case' })
}
