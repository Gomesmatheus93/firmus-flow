import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './schema'

/**
 * O PGlite aceita um objeto Date como parametro de consulta. O postgres-js, que
 * e o driver de producao, recusa: "the string argument must be of type string or
 * Buffer". Essa diferenca escondeu uma quebra do /admin que so apareceu no
 * Supabase, com os testes todos verdes.
 *
 * Entao o banco de teste reclama onde o de producao reclamaria. Nao e um teste
 * novo: e todo teste que roda SQL virando sentinela dessa classe de erro.
 *
 * Quando acontecer: o Drizzle converte a data sozinho em `gte(coluna, data)`,
 * porque ali ele conhece o tipo da coluna. Dentro de um template `sql` cru ele
 * nao conhece nada e passa o Date adiante — ali escreva
 * `sql`${data.toISOString()}::timestamptz``.
 */
const recusaDateCru = {
  logQuery(query: string, params: unknown[]) {
    const posicao = params.findIndex((p) => p instanceof Date)
    if (posicao === -1) return

    throw new Error(
      `Date cru no parametro $${posicao + 1}: o driver de producao recusaria. ` +
        'Dentro de um `sql` use `${data.toISOString()}::timestamptz`. ' +
        `Consulta: ${query}`,
    )
  },
}

/**
 * Banco de teste: um Postgres de verdade rodando dentro do processo do teste
 * (PGlite), com as nossas migrations aplicadas. Não precisa de Docker nem de
 * conexão com o Supabase, e cada teste ganha um banco limpo.
 *
 * Use só em testes. Em produção, `createDb` de './client'.
 */
export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema, casing: 'snake_case', logger: recusaDateCru })

  await migrate(db, { migrationsFolder: resolve(import.meta.dirname, '../drizzle') })

  return {
    db,
    async close() {
      await client.close()
    },
  }
}

export type TestDatabase = Awaited<ReturnType<typeof createTestDb>>['db']
