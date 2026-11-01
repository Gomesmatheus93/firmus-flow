import { buildBrandBrain } from '@firmus/agents/marca'
import type { ModelClient } from '@firmus/agents/runtime'
import type { Database } from '@firmus/db'
import { brandBrains } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, unavailable } from '../http/errors'
import { requireRole } from '../middleware/role'
import { usdBrlRate } from '../money/ptax'

/**
 * O Cérebro da Marca da empresa. Serve a tela de Marca e a de Auditoria —
 * os achados da auditoria ficam guardados aqui, em auditFindings.
 *
 * Devolve `brain: null` quando a empresa ainda não preencheu o onboarding.
 */
export function brandRoutes(db: Database, aiClient: ModelClient | null): Router {
  const router = Router()

  // O caminho na frente não é decoração: `router.use(mw)` sem caminho casa com
  // qualquer rota que entre neste roteador, e já derrubou a plataforma inteira
  // para o funcionário uma vez. Montar o Cérebro é configuração da marca, e
  // configuração é do chefe.
  router.use('/brand/brain', requireRole('chefe'))

  router.get('/brand', async (req, res) => {
    const { companyId } = req.company!

    const [brain] = await db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, companyId))
      .limit(1)

    res.json({ brain: brain ?? null })
  })

  const buildSchema = z.object({
    /** O que o dono conta sobre a empresa, do jeito que ele escreve. */
    description: z.string().trim().min(40, 'Conte um pouco mais sobre a empresa.').max(20_000),
  })

  /**
   * Monta o Cérebro a partir do texto do dono e salva.
   *
   * Síncrona de propósito: é uma chamada de IA só, e o chefe está olhando a
   * tela esperando. Quando o conteúdo entrar — muitas chamadas e imagem para
   * renderizar — é aí que a fila ganha motivo.
   */
  router.post('/brand/brain', async (req, res) => {
    const { companyId } = req.company!

    if (!aiClient) {
      throw unavailable(
        'A IA ainda não está configurada. Preencha ANTHROPIC_API_KEY no .env da raiz.',
        'ia_nao_configurada',
      )
    }

    const corpo = buildSchema.safeParse(req.body)
    if (!corpo.success) {
      throw badRequest(z.prettifyError(corpo.error))
    }

    const { draft } = await buildBrandBrain({
      db,
      client: aiClient,
      usdBrlRate: () => usdBrlRate(db),
      companyId,
      description: corpo.data.description,
    })

    // O que o agente monta sobrescreve só o que ele monta. Paleta, logo e
    // Instagram vêm do formulário do chefe, não da IA — por isso não entram
    // aqui nem são zerados.
    const campos = {
      context: draft.context,
      services: draft.services,
      audience: draft.audience,
      differentiators: draft.differentiators,
      toneOfVoice: draft.toneOfVoice,
      faq: draft.faq,
      updatedAt: new Date(),
    }

    const [brain] = await db
      .insert(brandBrains)
      .values({ companyId, ...campos })
      .onConflictDoUpdate({ target: brandBrains.companyId, set: campos })
      .returning()

    res.json({ brain, missing: draft.missing })
  })

  return router
}
