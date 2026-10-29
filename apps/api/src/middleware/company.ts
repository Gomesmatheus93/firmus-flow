import type { Database } from '@firmus/db'
import { memberships } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import type { RequestHandler } from 'express'
import { forbidden, unauthorized } from '../http/errors'
import type { CompanyContext } from '../auth/types'

/**
 * Descobre a empresa do usuário logado, lendo a tabela memberships.
 *
 * Este é o ponto único de onde sai o company_id do sistema. Nenhuma rota lê
 * company_id do corpo, da query ou da URL: se viesse do navegador, bastaria
 * trocar o número para ver os dados de outra empresa.
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

  return membership ?? null
}

/** Exige que o usuário pertença a alguma empresa. Use depois de requireAuth. */
export function requireCompany(db: Database): RequestHandler {
  return async (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized())
      return
    }

    const context = await loadCompanyContext(db, req.auth.id)

    if (!context) {
      next(
        forbidden(
          'Você ainda não faz parte de nenhuma empresa. Crie uma para continuar.',
          'sem_empresa',
        ),
      )
      return
    }

    req.company = context
    next()
  }
}
