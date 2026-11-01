import type { Database } from '@firmus/db'
import { companies, memberships, operatorAccess } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import type { Request, RequestHandler } from 'express'
import { forbidden, unauthorized } from '../http/errors'
import type { AuthUser, CompanyContext } from '../auth/types'

/** Cabeçalho pelo qual um operador da Firmus escolhe qual empresa quer ver. */
export const COMPANY_HEADER = 'x-firmus-company'

/**
 * Descobre a empresa do usuário pela tabela memberships.
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
 * O caminho do operador: ele escolhe uma empresa pelo cabeçalho.
 *
 * O cabeçalho só vale depois de o banco confirmar que aquele usuário é
 * operador. Para qualquer outra pessoa devolve null, e a requisição segue pelo
 * caminho normal — do contrário seria o buraco de confiar em company_id vindo
 * do navegador, que o CLAUDE.md proíbe.
 */
async function loadOperatorContext(
  db: Database,
  user: AuthUser,
  companyId: string,
): Promise<CompanyContext | null> {
  if (user.platformRole !== 'operador') return null

  const [empresa] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  if (!empresa) return null

  // Vê como chefe para as telas funcionarem. O que ele não pode ver é barrado
  // por blockOperator, não pelo papel.
  return { companyId: empresa.id, role: 'chefe', asOperator: true }
}

/**
 * Resolve a empresa de uma requisição: a escolhida pelo operador, se houver e
 * se ele for operador mesmo; senão a dele, pela tabela memberships.
 */
export async function resolveCompany(db: Database, req: Request): Promise<CompanyContext | null> {
  if (!req.auth) return null

  const escolhida = req.header(COMPANY_HEADER)?.trim()

  if (escolhida) {
    const contexto = await loadOperatorContext(db, req.auth, escolhida)
    if (contexto) return contexto
  }

  return loadCompanyContext(db, req.auth.id)
}

/**
 * Exige que o usuário tenha uma empresa — a dele, ou a que escolheu como
 * operador. Use depois de requireAuth.
 *
 * Toda entrada de operador numa empresa cliente fica registrada em
 * operator_access: sem rastro, "ver tudo" vira poder sem prestação de contas.
 */
export function requireCompany(db: Database): RequestHandler {
  return async (req, _res, next) => {
    if (!req.auth) {
      next(unauthorized())
      return
    }

    const contexto = await resolveCompany(db, req)

    if (!contexto) {
      next(
        forbidden(
          'Você ainda não faz parte de nenhuma empresa. Crie uma para continuar.',
          'sem_empresa',
        ),
      )
      return
    }

    if (contexto.asOperator) {
      await db.insert(operatorAccess).values({
        operatorUserId: req.auth.id,
        companyId: contexto.companyId,
        route: req.path,
      })
    }

    req.company = contexto
    next()
  }
}
