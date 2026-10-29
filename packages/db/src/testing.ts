import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './schema'

/**
 * Banco de teste: um Postgres de verdade rodando dentro do processo do teste
 * (PGlite), com as nossas migrations aplicadas. Não precisa de Docker nem de
 * conexão com o Supabase, e cada teste ganha um banco limpo.
 *
 * Use só em testes. Em produção, `createDb` de './client'.
 */
export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema, casing: 'snake_case' })

  await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') })

  return {
    db,
    async close() {
      await client.close()
    },
  }
}

export type TestDatabase = Awaited<ReturnType<typeof createTestDb>>['db']
