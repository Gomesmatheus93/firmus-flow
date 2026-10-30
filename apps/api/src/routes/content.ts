import type { Database } from '@firmus/db'
import { contentItems, users } from '@firmus/db/schema'
import { contentStatusSchema } from '@firmus/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'

/**
 * Peças criadas para o Instagram. Serve a tela de Criação e a de Aprovações.
 * O filtro por status é opcional: /content?status=aguardando devolve a fila
 * de aprovação.
 */
export function contentRoutes(db: Database): Router {
  const router = Router()

  router.get('/content', async (req, res) => {
    const { companyId } = req.company!

    const status = contentStatusSchema.safeParse(req.query.status)

    const where = status.success
      ? and(eq(contentItems.companyId, companyId), eq(contentItems.status, status.data))
      : eq(contentItems.companyId, companyId)

    const items = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        status: contentItems.status,
        title: contentItems.title,
        caption: contentItems.caption,
        reviewNote: contentItems.reviewNote,
        createdAt: contentItems.createdAt,
        authorName: users.fullName,
      })
      .from(contentItems)
      .leftJoin(users, eq(users.id, contentItems.createdByUserId))
      .where(where)
      .orderBy(desc(contentItems.createdAt))

    res.json({ items })
  })

  return router
}
