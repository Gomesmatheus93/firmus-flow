import type { Database } from '@firmus/db'
import { planEntries } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'

/** Calendário de planejamento da empresa. */
export function planRoutes(db: Database): Router {
  const router = Router()

  router.get('/plan', async (req, res) => {
    const { companyId } = req.company!

    const entries = await db
      .select()
      .from(planEntries)
      .where(eq(planEntries.companyId, companyId))
      .orderBy(planEntries.scheduledDate)

    res.json({ entries })
  })

  return router
}
