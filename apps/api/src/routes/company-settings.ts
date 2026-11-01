import type { Database } from '@firmus/db'
import { companies } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest } from '../http/errors'
import { blockOperator } from '../middleware/operator'
import { requireRole } from '../middleware/role'

const settingsSchema = z.object({
  name: z.string().trim().min(2, 'O nome da empresa é obrigatório.').max(120),
  segment: z.string().trim().max(120).optional(),
  /** Com ou sem arroba: guardamos sem. */
  instagramHandle: z.string().trim().max(60).optional(),
})

/**
 * Os dados da própria empresa, editáveis na tela de Configurações.
 *
 * Fica num roteador separado de `companies.ts` porque aquele trata de **criar**
 * empresa e é montado antes do requireCompany. Aqui o company_id vem da sessão,
 * como em toda rota de dado de cliente.
 */
export function companySettingsRoutes(db: Database): Router {
  const router = Router()

  // Só o chefe configura a marca e a empresa. E o operador da Firmus não entra:
  // ler os dados de um cliente para dar suporte é uma coisa, renomear a empresa
  // dele é outra.
  router.use('/company', requireRole('chefe'), blockOperator)

  router.patch('/company', async (req, res) => {
    const { companyId } = req.company!

    const corpo = settingsSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error))

    const handle = corpo.data.instagramHandle?.replace(/^@+/, '').trim()

    const [company] = await db
      .update(companies)
      .set({
        name: corpo.data.name,
        // Campo apagado na tela vira nulo no banco, não string vazia: "sem
        // segmento" e "segmento em branco" são a mesma coisa para quem lê.
        segment: corpo.data.segment || null,
        instagramHandle: handle || null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning()

    res.json({ company })
  })

  return router
}
