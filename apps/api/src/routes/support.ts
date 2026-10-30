import type { Database } from '@firmus/db'
import { contacts, conversations, leads, messages } from '@firmus/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { notFound } from '../http/errors'
import { pathParam } from '../http/params'

/** Conversas do WhatsApp e leads qualificados. */
export function supportRoutes(db: Database): Router {
  const router = Router()

  router.get('/conversations', async (req, res) => {
    const { companyId } = req.company!

    const rows = await db
      .select({
        id: conversations.id,
        status: conversations.status,
        unreadCount: conversations.unreadCount,
        lastMessageAt: conversations.lastMessageAt,
        contactName: contacts.name,
        contactPhone: contacts.phone,
      })
      .from(conversations)
      .innerJoin(contacts, eq(contacts.id, conversations.contactId))
      .where(eq(conversations.companyId, companyId))
      .orderBy(desc(conversations.lastMessageAt))

    res.json({ conversations: rows })
  })

  router.get('/conversations/:id/messages', async (req, res) => {
    const { companyId } = req.company!
    const conversationId = pathParam(req, 'id')

    // Confere que a conversa é desta empresa antes de devolver o histórico.
    const [conversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.id, conversationId), eq(conversations.companyId, companyId)))
      .limit(1)

    if (!conversation) throw notFound('Conversa não encontrada.')

    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(messages.sentAt)

    res.json({ messages: rows })
  })

  router.get('/leads', async (req, res) => {
    const { companyId } = req.company!

    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .orderBy(desc(leads.createdAt))

    res.json({ leads: rows })
  })

  return router
}
