import type { Database } from '@firmus/db'
import { companies, invitations, memberships } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { conflict, forbidden, notFound, unauthorized } from '../http/errors'
import { pathParam } from '../http/params'
import type { TokenVerifier } from '../auth/types'
import { requireAuth } from '../middleware/auth'

/**
 * Fluxo do convite.
 *
 * GET é público de propósito: quem recebe o link ainda não tem conta e precisa
 * ver de qual empresa é o convite antes de se cadastrar. Por isso devolvemos
 * só o nome da empresa e o e-mail convidado — nada mais.
 *
 * POST exige login: o usuário cria a conta no Supabase com o e-mail convidado,
 * volta com o token e aí entra na empresa.
 */
export function invitationRoutes(db: Database, verifyToken: TokenVerifier): Router {
  const router = Router()

  router.get('/invitations/:token', async (req, res) => {
    const [invitation] = await db
      .select({
        email: invitations.email,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        companyName: companies.name,
      })
      .from(invitations)
      .innerJoin(companies, eq(companies.id, invitations.companyId))
      .where(eq(invitations.token, pathParam(req, 'token')))
      .limit(1)

    if (!invitation || invitation.status !== 'pendente') {
      throw notFound('Este convite não existe ou já foi usado.', 'convite_invalido')
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw notFound('Este convite expirou. Peça um novo ao chefe.', 'convite_expirado')
    }

    res.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        companyName: invitation.companyName,
      },
    })
  })

  router.post('/invitations/:token/accept', requireAuth(db, verifyToken), async (req, res) => {
    if (!req.auth) throw unauthorized()

    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, pathParam(req, 'token')))
      .limit(1)

    if (!invitation || invitation.status !== 'pendente') {
      throw notFound('Este convite não existe ou já foi usado.', 'convite_invalido')
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw notFound('Este convite expirou. Peça um novo ao chefe.', 'convite_expirado')
    }

    // O convite é para um e-mail específico. Sem esta checagem, qualquer pessoa
    // com o link entraria na empresa.
    if (invitation.email.toLowerCase() !== req.auth.email.toLowerCase()) {
      throw forbidden(
        `Este convite é para ${invitation.email}. Entre com essa conta para aceitar.`,
        'convite_de_outro_email',
      )
    }

    const [existing] = await db
      .select({ id: memberships.id })
      .from(memberships)
      .where(eq(memberships.userId, req.auth.id))
      .limit(1)

    if (existing) {
      throw conflict('Você já faz parte de uma empresa.', 'ja_tem_empresa')
    }

    const userId = req.auth.id

    await db.transaction(async (tx) => {
      await tx.insert(memberships).values({
        userId,
        companyId: invitation.companyId,
        role: invitation.role,
      })

      await tx
        .update(invitations)
        .set({ status: 'aceito', acceptedAt: new Date() })
        .where(eq(invitations.id, invitation.id))
    })

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, invitation.companyId))
      .limit(1)

    res.json({
      company: {
        id: company!.id,
        name: company!.name,
        segment: company!.segment,
        instagramHandle: company!.instagramHandle,
        role: invitation.role,
      },
    })
  })

  return router
}
