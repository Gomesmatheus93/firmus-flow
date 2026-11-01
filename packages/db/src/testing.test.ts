import { companies } from './schema'
import { sql } from 'drizzle-orm'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { createTestDb } from './testing'

let db: Awaited<ReturnType<typeof createTestDb>>['db']
let close: () => Promise<void>

beforeEach(async () => {
  const teste = await createTestDb()
  db = teste.db
  close = teste.close
})

afterEach(async () => {
  await close()
})

// Prova que a sentinela do createTestDb esta ligada. Sem este teste, o dia em
// que ela parar de funcionar passa em silencio — e volta a existir a brecha que
// deixou o /admin quebrar so no Supabase.
it('o banco de teste recusa Date cru, como o driver de producao', async () => {
  const data = new Date('2026-11-01T00:00:00Z')

  await expect(
    db
      .select({ n: sql<number>`count(*) filter (where ${companies.createdAt} >= ${data})::int` })
      .from(companies),
  ).rejects.toThrow(/Date cru no parametro/)
})

it('a mesma data em ISO com cast passa', async () => {
  const data = new Date('2026-11-01T00:00:00Z')

  const [linha] = await db
    .select({
      n: sql<number>`count(*) filter (where ${companies.createdAt} >= ${data.toISOString()}::timestamptz)::int`,
    })
    .from(companies)

  expect(linha?.n).toBe(0)
})
