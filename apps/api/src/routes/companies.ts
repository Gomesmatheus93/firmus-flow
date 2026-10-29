import type { Database } from '@firmus/db'
import { brandBrains, companies, memberships } from '@firmus/db/schema'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, conflict, unauthorized } from '../http/errors'
import { loadCompanyContext } from '../middleware/company'

const createCompanySchema = z.object({
  name: z.string().trim().min(2, 'O nome da empresa precisa ter ao menos 2 letras.').max(120),
  segment: z.string().trim().max(160).optional(),
  instagramHandle: z.string().trim().max(60).optional(),
})

export function companyRoutes(db: Database): Router {
  const router = Router()

  /**
   * Cria a empresa e torna quem criou o `chefe` dela.
   * Também cria o Cérebro da Marca vazio, para o onboarding ter onde escrever.
   * Tudo numa transação: ou nasce completo, ou nada é gravado.
   */
  router.post('/companies', async (req, res) => {
    if (!req.auth) throw unauthorized()

    const parsed = createCompanySchema.safeParse(req.body)
    if (!parsed.success) throw badRequest(z.prettifyError(parsed.error))

    const existing = await loadCompanyContext(db, req.auth.id)
    if (existing) {
      throw conflict('Você já faz parte de uma empresa.', 'ja_tem_empresa')
    }

    const userId = req.auth.id

    const company = await db.transaction(async (tx) => {
      const [created] = await tx.insert(companies).values(parsed.data).returning()
      if (!created) throw new Error('A empresa não foi criada.')

      await tx.insert(memberships).values({
        userId,
        companyId: created.id,
        role: 'chefe',
      })

      await tx.insert(brandBrains).values({
        companyId: created.id,
        instagramHandle: parsed.data.instagramHandle ?? null,
      })

      return created
    })

    res.status(201).json({
      company: {
        id: company.id,
        name: company.name,
        segment: company.segment,
        instagramHandle: company.instagramHandle,
        role: 'chefe',
      },
    })
  })

  return router
}
