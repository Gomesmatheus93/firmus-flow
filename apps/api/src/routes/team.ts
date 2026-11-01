import { randomBytes } from 'node:crypto'
import type { Database } from '@firmus/db'
import { invitations, memberships, users } from '@firmus/db/schema'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, conflict, forbidden, notFound } from '../http/errors'
import { pathParam } from '../http/params'
import { requireRole } from '../middleware/role'

const INVITE_VALID_DAYS = 7

const inviteSchema = z.object({
  email: z.email('Informe um e-mail válido.').trim().toLowerCase(),
})

/**
 * Equipe da empresa. Todas as rotas aqui já passaram por requireAuth e
 * requireCompany, então req.company traz o company_id vindo do banco.
 * Toda consulta filtra por ele — é o que impede ver a equipe de outra empresa.
 */
export function teamRoutes(db: Database, webBaseUrl: string): Router {
  const router = Router()

  // O caminho '/team' aqui nao e decoracao: sem ele, router.use() casa com
  // QUALQUER rota que entre neste roteador. Como ele e montado antes dos
  // outros, o funcionario levava 403 em toda a plataforma, nao so na Equipe.
  router.use('/team', requireRole('chefe'))

  router.get('/team', async (req, res) => {
    const { companyId } = req.company!

    const members = await db
      .select({
        membershipId: memberships.id,
        userId: users.id,
        name: users.fullName,
        email: users.email,
        role: memberships.role,
        joinedAt: memberships.createdAt,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.companyId, companyId))

    const pending = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        sentAt: invitations.createdAt,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(and(eq(invitations.companyId, companyId), eq(invitations.status, 'pendente')))

    res.json({ members, pendingInvites: pending })
  })

  /**
   * Convida um funcionário. Ainda não enviamos e-mail: devolvemos o link para
   * o chefe compartilhar. O envio automático entra quando configurarmos o
   * provedor de e-mail.
   */
  router.post('/team/invitations', async (req, res) => {
    const { companyId } = req.company!
    const invitedByUserId = req.auth!.id

    const parsed = inviteSchema.safeParse(req.body)
    if (!parsed.success) throw badRequest(z.prettifyError(parsed.error))

    const { email } = parsed.data

    const [alreadyMember] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.companyId, companyId), eq(users.email, email)))
      .limit(1)

    if (alreadyMember) {
      throw conflict('Essa pessoa já faz parte da equipe.', 'ja_e_membro')
    }

    const token = randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000)

    const [invitation] = await db
      .insert(invitations)
      .values({
        companyId,
        email,
        role: 'funcionario',
        token,
        invitedByUserId,
        expiresAt,
      })
      // Já havia convite para este e-mail nesta empresa: renova token e validade.
      .onConflictDoUpdate({
        target: [invitations.companyId, invitations.email],
        set: { token, expiresAt, status: 'pendente', invitedByUserId, acceptedAt: null },
      })
      .returning()

    res.status(201).json({
      invitation: {
        id: invitation!.id,
        email: invitation!.email,
        role: invitation!.role,
        expiresAt: invitation!.expiresAt,
      },
      inviteUrl: `${webBaseUrl}/convite/${token}`,
    })
  })

  router.delete('/team/invitations/:id', async (req, res) => {
    const { companyId } = req.company!

    const [cancelled] = await db
      .update(invitations)
      .set({ status: 'cancelado' })
      .where(and(eq(invitations.id, pathParam(req, 'id')), eq(invitations.companyId, companyId)))
      .returning({ id: invitations.id })

    if (!cancelled) throw notFound('Convite não encontrado.')

    res.status(204).end()
  })

  router.delete('/team/members/:membershipId', async (req, res) => {
    const { companyId } = req.company!
    const requesterId = req.auth!.id

    const [target] = await db
      .select({ id: memberships.id, userId: memberships.userId, role: memberships.role })
      .from(memberships)
      .where(
        and(
          eq(memberships.id, pathParam(req, 'membershipId')),
          eq(memberships.companyId, companyId),
        ),
      )
      .limit(1)

    if (!target) throw notFound('Pessoa não encontrada nesta equipe.')

    if (target.userId === requesterId) {
      throw forbidden('Você não pode remover a si mesmo.', 'nao_remove_a_si')
    }

    if (target.role === 'chefe') {
      throw forbidden('Não dá para remover outro chefe.', 'nao_remove_chefe')
    }

    await db.delete(memberships).where(eq(memberships.id, target.id))

    res.status(204).end()
  })

  return router
}
