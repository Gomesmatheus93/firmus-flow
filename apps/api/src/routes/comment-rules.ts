import type { Database } from '@firmus/db'
import { commentEvents, commentRules } from '@firmus/db/schema'
import { commentTriggerSchema } from '@firmus/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, notFound } from '../http/errors'
import { pathParam } from '../http/params'
import { requireRole } from '../middleware/role'

const ruleSchema = z
  .object({
    name: z.string().trim().min(2, 'Dê um nome à regra.').max(80),
    triggerType: commentTriggerSchema,
    keywords: z.array(z.string().trim().min(1)).max(20).default([]),
    replyTemplate: z.string().trim().min(2, 'Escreva a resposta.').max(600),
  })
  .refine((rule) => rule.triggerType !== 'palavra' || rule.keywords.length > 0, {
    message: 'Informe ao menos uma palavra que dispara a regra.',
    path: ['keywords'],
  })

const patchSchema = z.object({ active: z.boolean() })

/**
 * Automação de comentários.
 *
 * É a única função que funciona inteira sem agente e sem a Meta: a regra é
 * escrita e guardada aqui. O envio da resposta depende da permissão
 * instagram_manage_comments, que exige revisão do app.
 *
 * Leitura: todos. Escrita: só o chefe, porque é configuração da empresa.
 */
export function commentRuleRoutes(db: Database): Router {
  const router = Router()

  router.get('/comment-rules', async (req, res) => {
    const { companyId } = req.company!

    const rules = await db
      .select()
      .from(commentRules)
      .where(eq(commentRules.companyId, companyId))
      .orderBy(desc(commentRules.createdAt))

    const events = await db
      .select()
      .from(commentEvents)
      .where(eq(commentEvents.companyId, companyId))
      .orderBy(desc(commentEvents.createdAt))
      .limit(50)

    res.json({ rules, events })
  })

  router.post('/comment-rules', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!

    const parsed = ruleSchema.safeParse(req.body)
    if (!parsed.success) throw badRequest(z.prettifyError(parsed.error))

    const [rule] = await db
      .insert(commentRules)
      .values({
        companyId,
        createdByUserId: req.auth!.id,
        name: parsed.data.name,
        triggerType: parsed.data.triggerType,
        keywords: parsed.data.triggerType === 'qualquer' ? [] : parsed.data.keywords,
        replyTemplate: parsed.data.replyTemplate,
      })
      .returning()

    res.status(201).json({ rule })
  })

  router.patch('/comment-rules/:id', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!

    const parsed = patchSchema.safeParse(req.body)
    if (!parsed.success) throw badRequest(z.prettifyError(parsed.error))

    const [rule] = await db
      .update(commentRules)
      .set({ active: parsed.data.active, updatedAt: new Date() })
      .where(and(eq(commentRules.id, pathParam(req, 'id')), eq(commentRules.companyId, companyId)))
      .returning()

    if (!rule) throw notFound('Regra não encontrada.')

    res.json({ rule })
  })

  router.delete('/comment-rules/:id', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!

    const [removed] = await db
      .delete(commentRules)
      .where(and(eq(commentRules.id, pathParam(req, 'id')), eq(commentRules.companyId, companyId)))
      .returning({ id: commentRules.id })

    if (!removed) throw notFound('Regra não encontrada.')

    res.status(204).end()
  })

  return router
}
