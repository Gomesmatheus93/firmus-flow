import { createHash } from 'node:crypto'
import { companies, memberships, users } from '@firmus/db/schema'
import { createTestDb } from '@firmus/db/testing'
import type { Role } from '@firmus/shared'
import { createApp } from '../app'
import type { AuthUser, TokenVerifier } from '../auth/types'

/**
 * Transforma um apelido legível ('chefe-aura') num UUID estável.
 * O banco exige uuid na coluna de id; os testes ficam mais fáceis de ler
 * usando apelidos. Mesmo apelido, mesmo uuid, sempre.
 */
function uuidFromLabel(label: string): string {
  const hex = createHash('sha256').update(label).digest('hex')
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-')
}

/**
 * Monta a api inteira contra um Postgres de verdade rodando no processo
 * (PGlite) e um verificador de token falso no lugar do Supabase.
 *
 * O token, nos testes, é o apelido do usuário. A api acredita nele como
 * acreditaria no Supabase — e todo o resto do caminho (memberships, papéis,
 * filtro por company_id) é o código de produção, sem simulação.
 */
export async function createHarness() {
  const { db, close } = await createTestDb()

  const knownUsers = new Map<string, AuthUser>()

  const verifyToken: TokenVerifier = async (token) => knownUsers.get(token) ?? null

  const app = createApp({ db, verifyToken, webBaseUrl: 'http://localhost:5173' })

  /** Registra um usuário no Supabase falso. Ele ainda não pertence a empresa nenhuma. */
  function addUser(user: { id: string; email: string; fullName: string }): string {
    const realId = uuidFromLabel(user.id)
    knownUsers.set(user.id, { id: realId, email: user.email, fullName: user.fullName })
    return realId
  }

  async function saveUserRow(label: string, email: string, fullName: string): Promise<string> {
    const id = addUser({ id: label, email, fullName })

    await db.insert(users).values({ id, email, fullName }).onConflictDoNothing()

    return id
  }

  /** Cria uma empresa já com um chefe dentro. */
  async function createCompanyWithBoss(input: {
    companyName: string
    userId: string
    email: string
    fullName: string
  }) {
    const userId = await saveUserRow(input.userId, input.email, input.fullName)

    const [company] = await db.insert(companies).values({ name: input.companyName }).returning()

    await db.insert(memberships).values({ userId, companyId: company!.id, role: 'chefe' })

    return { companyId: company!.id, userId }
  }

  /** Adiciona alguém a uma empresa existente, com o papel informado. */
  async function addMember(input: {
    companyId: string
    userId: string
    email: string
    fullName: string
    role: Role
  }) {
    const userId = await saveUserRow(input.userId, input.email, input.fullName)

    await db.insert(memberships).values({ userId, companyId: input.companyId, role: input.role })

    return { userId }
  }

  return { app, db, close, addUser, createCompanyWithBoss, addMember }
}

export type Harness = Awaited<ReturnType<typeof createHarness>>

/** Cabeçalho de autenticação para o apelido informado. */
export const asUser = (label: string) => ({ Authorization: `Bearer ${label}` })
