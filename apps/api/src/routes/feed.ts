import type { Database } from '@firmus/db'
import {
  contentItems,
  instagramConnections,
  instagramMedia,
  instagramSnapshots,
  scheduledPosts,
} from '@firmus/db/schema'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { Router } from 'express'
import { imagePathsOf } from '../content/body'
import type { AssetUrlSigner } from '../storage/supabase'

/** Quantos posts já publicados entram embaixo da grade. */
const PUBLICADOS = 30

/** Só formato que vai para a grade do perfil. Story e reel ficam de fora. */
const FORMATOS_DA_GRADE = ['carrossel', 'post'] as const

/**
 * A prévia do feed: como a grade do perfil vai ficar.
 *
 * Junta três coisas, nesta ordem, que é a ordem do Instagram (o mais novo em
 * cima):
 * 1. o que está programado (`agendado`), do mais distante para o mais próximo
 * 2. o que foi aprovado e ainda não tem data
 * 3. o que já está publicado, vindo do Instagram
 *
 * Peça com agendamento `publicado` não entra no item 1 nem no 2: ela já está
 * no perfil e aparece pelo item 3.
 */
export function feedRoutes(db: Database, signAssetUrls: AssetUrlSigner | null): Router {
  const router = Router()

  router.get('/feed', async (req, res) => {
    const { companyId } = req.company!

    const [ligacao] = await db
      .select({ username: instagramConnections.username })
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, companyId))
      .limit(1)

    const [retrato] = await db
      .select({ data: instagramSnapshots.data })
      .from(instagramSnapshots)
      .where(eq(instagramSnapshots.companyId, companyId))
      .limit(1)

    const perfil = retrato?.data.profile
    const profile = ligacao
      ? {
          username: perfil?.username ?? ligacao.username,
          name: perfil?.name ?? null,
          biography: perfil?.biography ?? null,
          profilePictureUrl: perfil?.profilePictureUrl ?? null,
          followers: perfil?.followers ?? null,
          follows: perfil?.follows ?? null,
          mediaCount: perfil?.mediaCount ?? null,
        }
      : null

    const pecas = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        status: contentItems.status,
        title: contentItems.title,
        body: contentItems.body,
        createdAt: contentItems.createdAt,
      })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.companyId, companyId),
          inArray(contentItems.type, [...FORMATOS_DA_GRADE]),
        ),
      )

    const agendamentos = await db
      .select({
        contentItemId: scheduledPosts.contentItemId,
        status: scheduledPosts.status,
        scheduledFor: scheduledPosts.scheduledFor,
      })
      .from(scheduledPosts)
      .where(eq(scheduledPosts.companyId, companyId))

    const publicadas = new Set(
      agendamentos.filter((a) => a.status === 'publicado').map((a) => a.contentItemId),
    )

    // A data mais próxima entre os agendamentos ativos de cada peça.
    const dataDe = new Map<string, Date>()
    for (const a of agendamentos) {
      // Na fila sem hora (rascunho) ainda não tem lugar no tempo.
      if (a.status !== 'agendado' || !a.scheduledFor) continue
      const atual = dataDe.get(a.contentItemId)
      if (!atual || a.scheduledFor < atual) dataDe.set(a.contentItemId, a.scheduledFor)
    }

    const vaoEntrar = pecas
      .filter((p) => !publicadas.has(p.id))
      .filter((p) => dataDe.has(p.id) || p.status === 'aprovado')
      .sort((a, b) => {
        const da = dataDe.get(a.id)
        const db_ = dataDe.get(b.id)
        if (da && db_) return db_.getTime() - da.getTime()
        if (da) return -1
        if (db_) return 1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

    // Uma chamada ao Storage para a tela inteira.
    const caminhos = vaoEntrar.map((p) => imagePathsOf(p.body, companyId))
    const links = signAssetUrls ? await signAssetUrls(caminhos.flat()) : []

    let inicio = 0
    const upcoming = vaoEntrar.map((p, n) => {
      const daPeca = links.slice(inicio, inicio + caminhos[n]!.length)
      inicio += caminhos[n]!.length

      return {
        id: p.id,
        type: p.type,
        status: p.status,
        title: p.title,
        scheduledFor: dataDe.get(p.id)?.toISOString() ?? null,
        images: daPeca.filter((u): u is string => u != null),
      }
    })

    const published = await db
      .select({
        id: instagramMedia.igMediaId,
        mediaType: instagramMedia.mediaType,
        mediaProductType: instagramMedia.mediaProductType,
        thumbnailUrl: instagramMedia.thumbnailUrl,
        permalink: instagramMedia.permalink,
        caption: instagramMedia.caption,
        postedAt: instagramMedia.postedAt,
      })
      .from(instagramMedia)
      .where(eq(instagramMedia.companyId, companyId))
      .orderBy(desc(instagramMedia.postedAt))
      .limit(PUBLICADOS)

    res.json({ profile, upcoming, published })
  })

  return router
}
