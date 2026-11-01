import type { Database } from '@firmus/db'
import { companies, users } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, unauthorized } from '../http/errors'
import { resolveCompany } from '../middleware/company'

/**
 * Quem sou eu e de qual empresa faço parte.
 *
 * É a primeira chamada da web depois do login. Se `company` vier nulo, o
 * usuário ainda não tem empresa — ou é um operador que ainda não escolheu
 * nenhuma, o que a web distingue pelo `platformRole`.
 *
 * Resolver aqui não registra acesso: isto é "quem sou eu", não uma consulta
 * aos dados do cliente. O registro acontece em requireCompany.
 */
export function meRoutes(db: Database): Router {
  const router = Router()

  router.get('/me', async (req, res) => {
    if (!req.auth) throw unauthorized()

    const context = await resolveCompany(db, req)

    if (!context) {
      res.json({ user: req.auth, company: null })
      return
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, context.companyId))
      .limit(1)

    res.json({
      user: req.auth,
      company: company
        ? {
            id: company.id,
            name: company.name,
            segment: company.segment,
            instagramHandle: company.instagramHandle,
            role: context.role,
            viewedAsOperator: context.asOperator,
          }
        : null,
    })
  })

  /**
   * O usuário editando o próprio nome.
   *
   * Não passa por requireCompany de propósito: é dado da pessoa, não da
   * empresa, e vale até para quem ainda não entrou em nenhuma. O id vem da
   * sessão, então ninguém edita o nome de outro.
   */
  router.patch('/me', async (req, res) => {
    if (!req.auth) throw unauthorized()

    const corpo = z
      .object({ fullName: z.string().trim().min(2, 'Diga seu nome.').max(120) })
      .safeParse(req.body)

    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error))

    const [user] = await db
      .update(users)
      .set({ fullName: corpo.data.fullName })
      .where(eq(users.id, req.auth.id))
      .returning({ id: users.id, email: users.email, fullName: users.fullName })

    res.json({ user })
  })

  return router
}
