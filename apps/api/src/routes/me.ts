import type { Database } from '@firmus/db'
import { companies } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { unauthorized } from '../http/errors'
import { resolveCompany } from '../middleware/company'

/**
 * Quem sou eu e de qual empresa faço parte.
 *
 * É a primeira chamada da web depois do login. Se `company` vier nulo, o
 * usuário ainda não tem empresa — ou é um operador que ainda não escolheu
 * nenhuma, o que a web distingue pelo `platformRole`.
 *
 * Resolver aqui não registra acesso: isto é "quem sou eu", não uma consulta
 * aos dados do cliente. O registro acontece em requireCompany.
 */
export function meRoutes(db: Database): Router {
  const router = Router()

  router.get('/me', async (req, res) => {
    if (!req.auth) throw unauthorized()

    const context = await resolveCompany(db, req)

    if (!context) {
      res.json({ user: req.auth, company: null })
      return
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, context.companyId))
      .limit(1)

    res.json({
      user: req.auth,
      company: company
        ? {
            id: company.id,
            name: company.name,
            segment: company.segment,
            instagramHandle: company.instagramHandle,
            role: context.role,
            viewedAsOperator: context.asOperator,
          }
        : null,
    })
  })

  return router
}
