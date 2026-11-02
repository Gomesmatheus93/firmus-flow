import type { Database } from '@firmus/db'
import {
  instagramConnections,
  instagramMedia,
  instagramMetrics,
  instagramSnapshots,
} from '@firmus/db/schema'
import { accountEngagementScore, postEngagementScore } from '@firmus/shared'
import { decrypt } from '@firmus/shared/crypto'
import { desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { badRequest } from '../http/errors'
import { InstagramApiError, type InstagramInsightsFetcher } from '../meta/instagram'
import { POSTS_ANALISADOS, type InstagramOverviewFetcher } from '../meta/instagram-overview'
import { blockOperator } from '../middleware/operator'
import { requireRole } from '../middleware/role'

/**
 * Métricas diárias do perfil, puxadas da API do Instagram.
 *
 * A coleta é manual por enquanto, pelo botão da tela. O certo é um job diário
 * no worker — por isso a busca mora em `meta/instagram.ts`, fora da rota: o dia
 * que o Redis subir, o mesmo código vira job sem reescrita.
 */
export function metricRoutes(
  db: Database,
  fetchInsights: InstagramInsightsFetcher,
  fetchOverview: InstagramOverviewFetcher,
): Router {
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

    const [retrato] = await db
      .select()
      .from(instagramSnapshots)
      .where(eq(instagramSnapshots.companyId, companyId))
      .limit(1)

    const posts = await db
      .select()
      .from(instagramMedia)
      .where(eq(instagramMedia.companyId, companyId))
      .orderBy(desc(instagramMedia.postedAt))
      .limit(POSTS_ANALISADOS)

    // O score é calculado aqui, num lugar só, para a tela e os agentes nunca
    // chegarem a números diferentes. A fórmula está em @firmus/shared.
    const comScore = posts.map((p) => ({
      igMediaId: p.igMediaId,
      caption: p.caption,
      mediaType: p.mediaType,
      mediaProductType: p.mediaProductType,
      permalink: p.permalink,
      thumbnailUrl: p.thumbnailUrl,
      postedAt: p.postedAt.toISOString(),
      likes: p.likes,
      comments: p.comments,
      reach: p.reach,
      views: p.views,
      saves: p.saves,
      shares: p.shares,
      profileVisits: p.profileVisits,
      totalInteractions: p.totalInteractions,
      score: postEngagementScore(p),
    }))

    res.json({
      days: days.reverse(),
      snapshot: retrato
        ? { ...retrato.data, fetchedAt: retrato.fetchedAt, refused: retrato.refused }
        : null,
      posts: comScore,
      score: accountEngagementScore(posts),
    })
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
    let overview
    try {
      const token = decrypt(ligacao.accessTokenCipher)
      ;[insights, overview] = await Promise.all([
        fetchInsights(token, ligacao.igAccountId),
        fetchOverview(token, ligacao.igAccountId),
      ])
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

    await db
      .insert(instagramSnapshots)
      .values({ companyId, data: overview.snapshot, refused: overview.recusadas })
      .onConflictDoUpdate({
        target: instagramSnapshots.companyId,
        set: { data: overview.snapshot, refused: overview.recusadas, fetchedAt: new Date() },
      })

    // Post já visto tem os números corrigidos; post novo entra.
    for (const post of overview.posts) {
      const { igMediaId, postedAt, ...resto } = post
      const linha = { ...resto, postedAt: new Date(postedAt), updatedAt: new Date() }

      await db
        .insert(instagramMedia)
        .values({ companyId, igMediaId, ...linha })
        .onConflictDoUpdate({
          target: [instagramMedia.companyId, instagramMedia.igMediaId],
          set: linha,
        })
    }

    // O número de seguidores também fica na conexão, como cache de exibição
    // para o cartão de Configurações não precisar ir à rede.
    if (insights.followers !== null) {
      await db
        .update(instagramConnections)
        .set({ followersCount: insights.followers, lastVerifiedAt: new Date() })
        .where(eq(instagramConnections.companyId, companyId))
    }

    // As duas coletas pedem algumas métricas iguais; a recusa aparece uma vez só.
    const refused = [...insights.recusadas, ...overview.recusadas].filter(
      (r, i, todas) => todas.findIndex((o) => o.metrica === r.metrica) === i,
    )

    res.json({ day: dia, refused })
  })

  return router
}
