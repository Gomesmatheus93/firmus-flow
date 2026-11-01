import type { Database } from '@firmus/db'
import { contentItems, users } from '@firmus/db/schema'
import { contentStatusSchema } from '@firmus/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, notFound } from '../http/errors'
import { requireRole } from '../middleware/role'

/**
 * Peças criadas para o Instagram. Serve a tela de Criação e a de Aprovações.
 * O filtro por status é opcional: /content?status=aguardando devolve a fila
 * de aprovação.
 */
/**
 * O que a revisao pode decidir. `aguardando` e `rascunho` ficam de fora: sao
 * para onde a peca vai sozinha ao ser criada, nao decisao de quem revisa.
 */
const reviewSchema = z
  .object({
    status: z.enum(['aprovado', 'ajustar', 'rejeitado']),
    reviewNote: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.status !== 'ajustar' || (v.reviewNote && v.reviewNote.length > 0), {
    message: 'Diga o que precisa mudar. Peça devolvida sem recado não é pedido de ajuste.',
    path: ['reviewNote'],
  })

export function contentRoutes(db: Database): Router {
  const router = Router()

  // Com o caminho na frente: sem ele, `router.use` pegaria tambem o GET abaixo
  // e o funcionario perderia a tela de Criacao inteira.
  router.use('/content/:id/status', requireRole('chefe'))

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

  /**
   * A decisao do chefe sobre uma peca: aprovar, pedir ajuste ou rejeitar.
   *
   * O filtro por companyId no UPDATE e o que impede uma empresa de mexer na
   * peca de outra. Peca de outra empresa devolve 404 e nao 403: "existe, mas
   * nao e sua" ja entrega informacao que nao e de quem perguntou.
   */
  router.patch('/content/:id/status', async (req, res) => {
    const { companyId } = req.company!

    const corpo = reviewSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error))

    const [item] = await db
      .update(contentItems)
      .set({
        status: corpo.data.status,
        // Aprovar ou rejeitar limpa o recado antigo: ele era sobre o ajuste
        // que foi pedido antes, e nao vale mais.
        reviewNote: corpo.data.status === 'ajustar' ? corpo.data.reviewNote! : null,
        updatedAt: new Date(),
      })
      .where(and(eq(contentItems.id, req.params.id), eq(contentItems.companyId, companyId)))
      .returning()

    if (!item) throw notFound('Essa peça não existe nesta empresa.')

    res.json({ item })
  })

  return router
}
