import type { Database } from '@firmus/db'
import { companies, memberships, operatorAccess } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from 'express'
import { forbidden, unauthorized } from '../http/errors'
import type { AuthUser, CompanyContext } from '../auth/types'

/** Cabeçalho pelo qual um operador escolhe qual empresa quer ver. */
export const COMPANY_HEADER = 'x-firmus-company'

/**
 * Descobre a empresa do usuário logado, lendo a tabela memberships.
 *
 * Este é o ponto único de onde sai o company_id do sistema. Nenhuma rota lê
 * company_id do corpo, da query ou da URL.
 */
export async function loadCompanyContext(
  db: Database,
  userId: string,
): Promise<CompanyContext | null> {
  const [membership] = await db
    .select({ companyId: memberships.companyId, role: memberships.role })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1)

  return membership ? { ...membership, asOperator: false } : null
}

/**
 * O caminho do operador da Firmus: ele escolhe uma empresa pelo cabeçalho.
 *
 * O cabeçalho só é obedecido depois de o banco confirmar que aquele usuário é
 * operador. Para qualquer outra pessoa ele é ignorado em silêncio — do
 * contrário seria exatamente o buraco de confiar em company_id vindo do
 * navegador, que o CLAUDE.md proíbe.
 *
 * Toda entrada é registrada em operator_access: sem rastro, "ver tudo" vira
 * poder sem prestação de contas.
 */
async function loadOperatorContext(
  db: Database,
  user: AuthUser,
  companyId: string,
  route: string,
): Promise<CompanyContext | null> {
  if (user.platformRole !== 'operador') return null

  const [empresa] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  if (!empresa) return null

  await db.insert(operatorAccess).values({
    operatorUserId: user.id,
    companyId: empresa.id,
    route,
  })

  // Vê como chefe para as telas funcionarem; o que ele não pode ver é barrado
  // por blockOperator, não pelo papel.
  return { companyId: empresa.id, role: 'chefe', asOperator: true }
}

/** Exige que o usuário pertença a alguma empresa. Use depois de requireAuth. */
export function requireCompany(db: Database): RequestHandler {
  return async (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized())
      return
    }

    const escolhida = req.header(COMPANY_HEADER)?.trim()

    if (escolhida) {
      const contexto = await loadOperatorContext(db, req.auth, escolhida, req.path)

      if (contexto) {
        req.company = contexto
        next()
        return
      }

      // Não é operador, ou a empresa não existe: cai no caminho normal, como
      // se o cabeçalho não tivesse vindo.
    }

    const contexto = await loadCompanyContext(db, req.auth.id)

    if (!contexto) {
      next(
        forbidden(
          'Você ainda não faz parte de nenhuma empresa. Crie uma para continuar.',
          'sem_empresa',
        ),
      )
      return
    }

    req.company = contexto
    next()
  }
}
