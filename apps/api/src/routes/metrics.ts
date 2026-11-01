import type { Database } from '@firmus/db'
import { instagramConnections, instagramMetrics } from '@firmus/db/schema'
import { decrypt } from '@firmus/shared/crypto'
import { desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { badRequest } from '../http/errors'
import { InstagramApiError, type InstagramInsightsFetcher } from '../meta/instagram'
import { blockOperator } from '../middleware/operator'
import { requireRole } from '../middleware/role'

/**
 * Métricas diárias do perfil, puxadas da API do Instagram.
 *
 * A coleta é manual por enquanto, pelo botão da tela. O certo é um job diário
 * no worker — por isso a busca mora em `meta/instagram.ts`, fora da rota: o dia
 * que o Redis subir, o mesmo código vira job sem reescrita.
 */
export function metricRoutes(db: Database, fetchInsights: InstagramInsightsFetcher): Router {
  const router = Router()

  // Atualizar usa a credencial da empresa, então vale a mesma regra da conexão.
  router.use('/metrics/refresh', requireRole('chefe'), blockOperator)

  router.get('/metrics', async (req, res) => {
    const { companyId } = req.company!

    const days = await db
      .select()
      .from(instagramMetrics)
      .where(eq(instagramMetrics.companyId, companyId))
      .orderBy(desc(instagramMetrics.capturedOn))
      .limit(90)

    res.json({ days: days.reverse() })
  })

  router.post('/metrics/refresh', async (req, res) => {
    const { companyId } = req.company!

    const [ligacao] = await db
      .select()
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, companyId))
      .limit(1)

    if (!ligacao) {
      throw badRequest(
        'Conecte o Instagram da empresa antes, em Configurações.',
        'sem_conexao_instagram',
      )
    }

    let insights
    try {
      insights = await fetchInsights(decrypt(ligacao.accessTokenCipher), ligacao.igAccountId)
    } catch (erro) {
      if (erro instanceof InstagramApiError) throw badRequest(erro.message, 'meta_recusou')
      throw erro
    }

    // Um registro por dia: atualizar duas vezes no mesmo dia corrige a linha,
    // não cria uma segunda. A chave única empresa+dia já existe na tabela.
    const capturedOn = new Date().toISOString().slice(0, 10)

    const numeros = {
      followers: insights.followers,
      reach: insights.reach,
      views: insights.views,
      accountsEngaged: insights.accountsEngaged,
      interactions: insights.interactions,
    }

    const [dia] = await db
      .insert(instagramMetrics)
      .values({ companyId, capturedOn, ...numeros })
      .onConflictDoUpdate({
        target: [instagramMetrics.companyId, instagramMetrics.capturedOn],
        set: numeros,
      })
      .returning()

    // O número de seguidores também fica na conexão, como cache de exibição
    // para o cartão de Configurações não precisar ir à rede.
    if (insights.followers !== null) {
      await db
        .update(instagramConnections)
        .set({ followersCount: insights.followers, lastVerifiedAt: new Date() })
        .where(eq(instagramConnections.companyId, companyId))
    }

    res.json({ day: dia, refused: insights.recusadas })
  })

  return router
}
