import type { Database } from '@firmus/db'
import { trendReports } from '@firmus/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Router } from 'express'

/** Relatórios do ig-viral, do mais recente para o mais antigo. */
export function trendRoutes(db: Database): Router {
  const router = Router()

  router.get('/trends', async (req, res) => {
    const { companyId } = req.company!

    const reports = await db
      .select()
      .from(trendReports)
      .where(eq(trendReports.companyId, companyId))
      .orderBy(desc(trendReports.generatedAt))
      .limit(20)

    res.json({ reports })
  })

  return router
}
