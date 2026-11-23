import type { Database } from '@firmus/db'
import { contentItems, scheduledPosts } from '@firmus/db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { slidesOf } from '../content/body'
import { badRequest, conflict, notFound } from '../http/errors'
import { requireRole } from '../middleware/role'
import { publishPost, type PublishingDeps } from '../publishing/run'
import type { AssetUrlSigner } from '../storage/supabase'

/** Formatos que têm arte para publicar. Reel aqui é roteiro, sem arte. */
const PUBLICAVEIS = ['carrossel', 'post', 'story'] as const

/** Situações em que a postagem ainda está na fila e pode ser mexida. */
const NA_FILA = ['rascunho', 'agendado'] as const

/** O que o chefe ainda pode mexer: o que está na fila e o que falhou (tentar de novo). */
const EDITAVEIS = [...NA_FILA, 'falhou'] as const

/**
 * Um @ do Instagram: sem o @, minúsculo, só letras, números, ponto e
 * sublinhado, até 30 caracteres — a regra de nome de usuário do Instagram.
 */
const arroba = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@+/, '').toLowerCase())
  .refine((v) => /^[a-z0-9._]{1,30}$/.test(v), {
    message: 'Use o @ da conta: letras, números, ponto e sublinhado.',
  })

const configSchema = z.object({
  collaborators: z
    .array(arroba)
    .max(3, 'O Instagram aceita no máximo 3 colaboradores.')
    .transform((lista) => [...new Set(lista)]),
  commentAutomation: z.boolean(),
})

const publicarSchema = z.discriminatedUnion('acao', [
  configSchema.extend({ acao: z.literal('agendar'), scheduledFor: z.iso.datetime() }),
  configSchema.extend({ acao: z.literal('agora') }),
])

/**
 * O Programador de postagem: a fila do que vai ao ar.
 *
 * A peça chega pelo botão "Enviar para postar" (só peça aprovada) e fica como
 * rascunho, sem hora. Daqui o chefe escolhe colaboradores, liga a automação de
 * comentários e agenda ou manda postar agora.
 *
 * Publicar de verdade depende da revisão do app na Meta (regra 6 do
 * CLAUDE.md). Até lá, "postar agora" e "agendar" guardam a postagem na fila
 * com a hora; nada é enviado ao Instagram, e a tela avisa.
 */
export function scheduledPostRoutes(
  db: Database,
  signAssetUrls: AssetUrlSigner | null,
  publishing: PublishingDeps | null = null,
  runInBackground: (trabalho: Promise<unknown>) => void = (t) => void t,
): Router {
  const router = Router()

  /** Acha a postagem desta empresa ainda na fila, ou 404/409. */
  async function daFila(companyId: string, id: string) {
    if (!z.uuid().safeParse(id).success) {
      throw notFound('Essa postagem não existe.', 'postagem_nao_encontrada')
    }
    const [post] = await db
      .select({
        id: scheduledPosts.id,
        status: scheduledPosts.status,
        contentType: contentItems.type,
      })
      .from(scheduledPosts)
      .innerJoin(contentItems, eq(contentItems.id, scheduledPosts.contentItemId))
      .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.companyId, companyId)))
      .limit(1)

    if (!post) throw notFound('Essa postagem não existe.', 'postagem_nao_encontrada')
    if (!(EDITAVEIS as readonly string[]).includes(post.status)) {
      throw conflict(
        post.status === 'publicando'
          ? 'Essa postagem está sendo publicada agora.'
          : 'Essa postagem já saiu da fila.',
        'postagem_fora_da_fila',
      )
    }
    return post
  }

  router.get('/scheduled-posts', async (req, res) => {
    const { companyId } = req.company!

    const linhas = await db
      .select({
        id: scheduledPosts.id,
        contentItemId: scheduledPosts.contentItemId,
        scheduledFor: scheduledPosts.scheduledFor,
        status: scheduledPosts.status,
        publishedAt: scheduledPosts.publishedAt,
        errorMessage: scheduledPosts.errorMessage,
        permalink: scheduledPosts.permalink,
        collaborators: scheduledPosts.collaborators,
        commentAutomation: scheduledPosts.commentAutomation,
        contentTitle: contentItems.title,
        contentType: contentItems.type,
        body: contentItems.body,
      })
      .from(scheduledPosts)
      .innerJoin(contentItems, eq(contentItems.id, scheduledPosts.contentItemId))
      .where(eq(scheduledPosts.companyId, companyId))
      // Sem hora primeiro: é o que ainda espera decisão.
      .orderBy(sql`${scheduledPosts.scheduledFor} asc nulls first`, scheduledPosts.createdAt)

    // A capa de cada peça, só de dentro da pasta da empresa. O gerador de
    // links devolve na mesma ordem; caminho de fora vira string vazia e volta nulo.
    const pasta = `${companyId}/`
    const capas = linhas.map((l) => {
      const caminho = slidesOf(l.body)[0]?.imagePath
      return caminho?.startsWith(pasta) ? caminho : ''
    })
    const links = signAssetUrls ? await signAssetUrls(capas) : capas.map(() => null)

    res.json({
      posts: linhas.map(({ body, ...l }, n) => ({
        ...l,
        slideCount: slidesOf(body).length,
        coverUrl: capas[n] ? (links[n] ?? null) : null,
      })),
    })
  })

  /** "Enviar para postar": põe a peça aprovada na fila, sem hora ainda. */
  router.post('/scheduled-posts', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!

    const corpo = z.object({ contentItemId: z.uuid() }).safeParse(req.body)
    if (!corpo.success) throw badRequest('Diga qual peça vai para o Programador.')

    const [peca] = await db
      .select({ id: contentItems.id, type: contentItems.type, status: contentItems.status })
      .from(contentItems)
      .where(
        and(eq(contentItems.id, corpo.data.contentItemId), eq(contentItems.companyId, companyId)),
      )
      .limit(1)

    if (!peca) throw notFound('Essa peça não existe nesta empresa.')
    if (!(PUBLICAVEIS as readonly string[]).includes(peca.type)) {
      throw badRequest('Só carrossel, post e story vão para o Programador.', 'formato_sem_arte')
    }
    if (peca.status !== 'aprovado') {
      throw conflict('Aprove a peça antes de enviar para postar.', 'peca_nao_aprovada')
    }

    // Peça que já está na fila não entra de novo: devolve a que existe.
    const [existente] = await db
      .select({ id: scheduledPosts.id })
      .from(scheduledPosts)
      .where(
        and(
          eq(scheduledPosts.companyId, companyId),
          eq(scheduledPosts.contentItemId, peca.id),
          inArray(scheduledPosts.status, [...NA_FILA]),
        ),
      )
      .limit(1)

    if (existente) {
      res.json({ post: existente, alreadyQueued: true })
      return
    }

    const [post] = await db
      .insert(scheduledPosts)
      .values({
        companyId,
        contentItemId: peca.id,
        status: 'rascunho',
        createdByUserId: req.auth!.id,
      })
      .returning({ id: scheduledPosts.id })

    res.status(201).json({ post, alreadyQueued: false })
  })

  /** Agendar numa data ou postar agora, com colaboradores e automação. */
  router.put('/scheduled-posts/:id', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!
    const post = await daFila(companyId, String(req.params.id))

    const corpo = publicarSchema.safeParse(req.body)
    if (!corpo.success) {
      throw badRequest(corpo.error.issues[0]?.message ?? 'Dados inválidos.')
    }

    const agora = new Date()
    const quando = corpo.data.acao === 'agora' ? agora : new Date(corpo.data.scheduledFor)
    if (corpo.data.acao === 'agendar' && quando.getTime() <= agora.getTime()) {
      throw badRequest('Escolha uma data e hora no futuro.', 'data_no_passado')
    }

    // Story não tem post em colaboração nem comentários: lá se responde por direct.
    const story = post.contentType === 'story'

    const [salvo] = await db
      .update(scheduledPosts)
      .set({
        scheduledFor: quando,
        status: 'agendado',
        collaborators: story ? [] : corpo.data.collaborators,
        commentAutomation: story ? false : corpo.data.commentAutomation,
        errorMessage: null,
        updatedAt: agora,
      })
      .where(and(eq(scheduledPosts.id, post.id), eq(scheduledPosts.companyId, companyId)))
      .returning({
        id: scheduledPosts.id,
        scheduledFor: scheduledPosts.scheduledFor,
        status: scheduledPosts.status,
      })

    // "Postar agora" publica em seguida, depois da resposta: a tela mostra
    // "publicando" e atualiza sozinha. O agendado espera a checagem do minuto.
    if (corpo.data.acao === 'agora' && publishing) {
      runInBackground(publishPost(publishing, post.id))
    }

    res.json({ post: salvo, publishing: corpo.data.acao === 'agora' && publishing !== null })
  })

  /** Tira a peça da fila. A peça continua na Criação. */
  router.delete('/scheduled-posts/:id', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!
    const post = await daFila(companyId, String(req.params.id))

    await db
      .delete(scheduledPosts)
      .where(and(eq(scheduledPosts.id, post.id), eq(scheduledPosts.companyId, companyId)))

    res.status(204).end()
  })

  return router
}
