import type { Database } from '@firmus/db'
import { companies, contentItems, leads, memberships } from '@firmus/db/schema'
import { count, eq, sql } from 'drizzle-orm'
import { Router } from 'express'
import { requireOperator } from '../middleware/operator'

/**
 * Área da equipe da Firmus.
 *
 * Devolve só número: quantas pessoas, quantos conteúdos, quantos leads. Nunca
 * o conteúdo em si. Para ver as telas de uma empresa, o operador escolhe ela
 * pelo cabeçalho e usa as rotas normais — que ficam registradas.
 */
export function adminRoutes(db: Database): Router {
  const router = Router()

  router.use('/admin', requireOperator)

  router.get('/admin/companies', async (_req, res) => {
    const linhas = await db
      .select({
        id: companies.id,
        name: companies.name,
        segment: companies.segment,
        instagramHandle: companies.instagramHandle,
        createdAt: companies.createdAt,
        members: count(memberships.id),
        contentCount: sql<number>`(
          select count(*)::int from ${contentItems}
          where ${contentItems.companyId} = ${companies.id}
        )`,
        leadCount: sql<number>`(
          select count(*)::int from ${leads}
          where ${leads.companyId} = ${companies.id}
        )`,
      })
      .from(companies)
      .leftJoin(memberships, eq(memberships.companyId, companies.id))
      .groupBy(companies.id)
      .orderBy(companies.name)

    res.json({ companies: linhas })
  })

  return router
}
