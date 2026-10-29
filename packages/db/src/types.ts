import type { ExtractTablesWithRelations } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type * as schema from './schema'

/**
 * O banco, sem amarrar ao driver.
 *
 * Em produção o driver é o postgres-js; nos testes é o PGlite. Os dois
 * implementam esta mesma interface, então a api aceita qualquer um dos dois
 * sem precisar de simulação nem de dois caminhos de código.
 */
export type Database = PgDatabase<
  PgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>
