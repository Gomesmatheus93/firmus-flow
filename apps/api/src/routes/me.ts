import type { Database } from '@firmus/db'
import { companies } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { unauthorized } from '../http/errors'
import { loadCompanyContext } from '../middleware/company'

/**
 * Quem sou eu e de qual empresa faço parte.
 * É a primeira chamada da web depois do login: se `company` vier nulo,
 * o usuário ainda não tem empresa e é mandado para criar uma.
 */
export function meRoutes(db: Database): Router {
  const router = Router()

  router.get('/me', async (req, res) => {
    if (!req.auth) throw unauthorized()

    const context = await loadCompanyContext(db, req.auth.id)

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
          }
        : null,
    })
  })

  return router
}
