import type { Database } from '@firmus/db'
import { brandBrains } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'

/**
 * O Cérebro da Marca da empresa. Serve a tela de Marca e a de Auditoria —
 * os achados da auditoria ficam guardados aqui, em auditFindings.
 *
 * Devolve `brain: null` quando a empresa ainda não preencheu o onboarding.
 */
export function brandRoutes(db: Database): Router {
  const router = Router()

  router.get('/brand', async (req, res) => {
    const { companyId } = req.company!

    const [brain] = await db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, companyId))
      .limit(1)

    res.json({ brain: brain ?? null })
  })

  return router
}
