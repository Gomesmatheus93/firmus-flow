import type { Database } from '@firmus/db'
import { instagramMetrics } from '@firmus/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Router } from 'express'

/**
 * Métricas diárias do perfil. Fica vazio até a conta passar pela revisão do
 * app na Meta e ganhar a permissão instagram_manage_insights.
 */
export function metricRoutes(db: Database): Router {
  const router = Router()

  router.get('/metrics', async (req, res) => {
    const { companyId } = req.company!

    const days = await db
      .select()
      .from(instagramMetrics)
      .where(eq(instagramMetrics.companyId, companyId))
      .orderBy(desc(instagramMetrics.capturedOn))
      .limit(90)

    res.json({ days: days.reverse() })
  })

  return router
}
