import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { createTestDb } from '../testing'
import { companies, memberships, users } from './index'

let close: (() => Promise<void>) | undefined

afterEach(async () => {
  await close?.()
  close = undefined
})

async function setup() {
  const testDb = await createTestDb()
  close = testDb.close
  return testDb.db
}

describe('schema', () => {
  it('aplica as migrations e liga usuário, empresa e papel', async () => {
    const db = await setup()

    const [company] = await db.insert(companies).values({ name: 'Studio Aura' }).returning()
    const [user] = await db
      .insert(users)
      .values({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'matheus@studioaura.com.br',
        fullName: 'Matheus Gomes',
      })
      .returning()

    await db.insert(memberships).values({
      userId: user!.id,
      companyId: company!.id,
      role: 'chefe',
    })

    const found = await db.select().from(memberships).where(eq(memberships.userId, user!.id))

    expect(found).toHaveLength(1)
    expect(found[0]?.role).toBe('chefe')
    expect(found[0]?.companyId).toBe(company!.id)
  })

  it('recusa dois papéis para o mesmo usuário na mesma empresa', async () => {
    const db = await setup()

    const [company] = await db.insert(companies).values({ name: 'Studio Aura' }).returning()
    const [user] = await db
      .insert(users)
      .values({
        id: '22222222-2222-2222-2222-222222222222',
        email: 'ana@studioaura.com.br',
        fullName: 'Ana Beatriz',
      })
      .returning()

    await db
      .insert(memberships)
      .values({ userId: user!.id, companyId: company!.id, role: 'funcionario' })

    await expect(
      db.insert(memberships).values({ userId: user!.id, companyId: company!.id, role: 'chefe' }),
    ).rejects.toThrow()
  })

  it('apaga o Cérebro da Marca junto com a empresa', async () => {
    const db = await setup()

    const [company] = await db.insert(companies).values({ name: 'Temporária' }).returning()
    await db.delete(companies).where(eq(companies.id, company!.id))

    const rest = await db.select().from(companies)
    expect(rest).toHaveLength(0)
  })
})
