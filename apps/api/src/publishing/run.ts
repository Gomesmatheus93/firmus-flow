import type { Database } from '@firmus/db'
import { contentItems, instagramConnections, scheduledPosts } from '@firmus/db/schema'
import { decrypt } from '@firmus/shared/crypto'
import { and, eq, inArray, lt, lte } from 'drizzle-orm'
import { imagePathsOf } from '../content/body'
import type { InstagramPublisher } from '../meta/publish'
import type { ImagePreparer } from './images'

export type PublishingDeps = {
  db: Database
  publish: InstagramPublisher
  prepareImages: ImagePreparer
}

/** Postagem que ficou "publicando" mais que isso travou: o processo caiu no meio. */
const TRAVADA_MS = 15 * 60 * 1000

/**
 * Publica uma postagem da fila, se ela estiver na hora.
 *
 * A primeira coisa é "reservar": muda de `agendado` para `publicando` numa
 * única atualização que só vale se ninguém reservou antes. É o que impede o
 * "Postar agora" e a checagem de minuto em minuto de publicarem o mesmo post
 * duas vezes. Quem não conseguiu reservar só volta.
 *
 * Erro nunca escapa: vira `falhou` com a mensagem, para a tela mostrar e o
 * chefe tentar de novo.
 */
export async function publishPost(deps: PublishingDeps, scheduledPostId: string): Promise<void> {
  const { db } = deps
  const agora = new Date()

  const [post] = await db
    .update(scheduledPosts)
    .set({ status: 'publicando', errorMessage: null, updatedAt: agora })
    .where(
      and(
        eq(scheduledPosts.id, scheduledPostId),
        eq(scheduledPosts.status, 'agendado'),
        lte(scheduledPosts.scheduledFor, agora),
      ),
    )
    .returning()

  if (!post) return

  const falhar = async (mensagem: string) => {
    await db
      .update(scheduledPosts)
      .set({ status: 'falhou', errorMessage: mensagem, updatedAt: new Date() })
      .where(eq(scheduledPosts.id, post.id))
  }

  try {
    const [ligacao] = await db
      .select()
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, post.companyId))
      .limit(1)
    if (!ligacao) {
      await falhar('O Instagram da empresa não está conectado. Conecte em Configurações.')
      return
    }

    const [peca] = await db
      .select({ type: contentItems.type, caption: contentItems.caption, body: contentItems.body })
      .from(contentItems)
      .where(
        and(eq(contentItems.id, post.contentItemId), eq(contentItems.companyId, post.companyId)),
      )
      .limit(1)
    if (!peca || peca.type === 'reel') {
      await falhar('A peça não existe mais ou não tem arte para publicar.')
      return
    }

    const caminhos = imagePathsOf(peca.body, post.companyId)
    if (caminhos.length === 0) {
      await falhar('A peça ainda não tem as artes prontas.')
      return
    }

    const imageUrls = await deps.prepareImages({
      companyId: post.companyId,
      scheduledPostId: post.id,
      paths: peca.type === 'post' ? caminhos.slice(0, 1) : caminhos,
    })

    const resultado = await deps.publish({
      token: decrypt(ligacao.accessTokenCipher),
      igAccountId: ligacao.igAccountId,
      type: peca.type,
      imageUrls,
      caption: peca.caption,
      collaborators: post.collaborators,
    })

    await db
      .update(scheduledPosts)
      .set({
        status: 'publicado',
        publishedAt: new Date(),
        externalId: resultado.mediaId,
        permalink: resultado.permalink,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, post.id))
  } catch (erro) {
    await falhar(erro instanceof Error ? erro.message : 'Erro desconhecido ao publicar.')
  }
}

/**
 * A checagem periódica: publica tudo que está agendado e já passou da hora,
 * de todas as empresas, um de cada vez. Também solta postagem travada em
 * `publicando` (o processo caiu no meio), marcando como falha para o chefe
 * tentar de novo — melhor do que tentar sozinho e arriscar post duplicado.
 */
export async function publishDuePosts(deps: PublishingDeps): Promise<number> {
  const { db } = deps
  const agora = new Date()

  await db
    .update(scheduledPosts)
    .set({
      status: 'falhou',
      errorMessage:
        'A publicação foi interrompida no meio. Confira no Instagram se o post saiu antes de tentar de novo.',
      updatedAt: agora,
    })
    .where(
      and(
        eq(scheduledPosts.status, 'publicando'),
        lt(scheduledPosts.updatedAt, new Date(agora.getTime() - TRAVADA_MS)),
      ),
    )

  const vencidas = await db
    .select({ id: scheduledPosts.id })
    .from(scheduledPosts)
    .where(
      and(inArray(scheduledPosts.status, ['agendado']), lte(scheduledPosts.scheduledFor, agora)),
    )
    .orderBy(scheduledPosts.scheduledFor)
    .limit(20)

  for (const { id } of vencidas) await publishPost(deps, id)
  return vencidas.length
}
