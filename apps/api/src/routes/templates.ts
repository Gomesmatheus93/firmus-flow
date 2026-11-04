import type { Database } from '@firmus/db'
import { companyTemplates } from '@firmus/db/schema'
import { isTemplateKey, TEMPLATE_KEYS } from '@firmus/templates'
import { eq } from 'drizzle-orm'
import { Router } from 'express'

/**
 * Os modelos visuais liberados para a empresa da sessão.
 *
 * Devolve só as chaves: o desenho de cada modelo mora em @firmus/templates e a
 * tela já o tem. O que é de cada empresa é decidido aqui, pelo banco, e nunca
 * pelo navegador — modelo exclusivo de uma empresa não aparece para outra.
 */
export function templateRoutes(db: Database): Router {
  const router = Router()

  router.get('/templates', async (req, res) => {
    const { companyId } = req.company!

    const linhas = await db
      .select({ key: companyTemplates.templateKey })
      .from(companyTemplates)
      .where(eq(companyTemplates.companyId, companyId))

    // Na ordem do catálogo, e sem chave que o código não conhece mais.
    const liberadas = new Set(linhas.map((l) => l.key).filter(isTemplateKey))
    const keys = TEMPLATE_KEYS.filter((k) => liberadas.has(k))

    res.json({ keys })
  })

  return router
}
