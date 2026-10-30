import type { Database } from '@firmus/db'
import { contentItems, scheduledPosts } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'

/** Fila do programador de postagem. */
export function scheduledPostRoutes(db: Database): Router {
  const router = Router()

  router.get('/scheduled-posts', async (req, res) => {
    const { companyId } = req.company!

    const posts = await db
      .select({
        id: scheduledPosts.id,
        scheduledFor: scheduledPosts.scheduledFor,
        status: scheduledPosts.status,
        publishedAt: scheduledPosts.publishedAt,
        errorMessage: scheduledPosts.errorMessage,
        contentTitle: contentItems.title,
        contentType: contentItems.type,
      })
      .from(scheduledPosts)
      .innerJoin(contentItems, eq(contentItems.id, scheduledPosts.contentItemId))
      .where(eq(scheduledPosts.companyId, companyId))
      .orderBy(scheduledPosts.scheduledFor)

    res.json({ posts })
  })

  return router
}
