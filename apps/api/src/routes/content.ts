import type { Database } from '@firmus/db'
import { contentItems, users } from '@firmus/db/schema'
import { contentStatusSchema } from '@firmus/shared'
import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { badRequest, notFound } from '../http/errors'
import { requireRole } from '../middleware/role'
import type { AssetRemover, AssetUrlSigner } from '../storage/supabase'

/** Texto opcional do body: ausente, nulo ou vazio viram `null`. */
const textoOpcional = z
  .string()
  .nullish()
  .transform((v) => v?.trim() || null)

/**
 * O pedaço do `body` que a tela usa: o texto e o caminho da imagem de cada
 * slide. O resto do body varia por formato e fica no banco.
 */
const slidesSchema = z.object({
  /** O modelo visual usado, quando a peça foi feita com um. */
  template: z.string().optional(),
  slides: z.array(
    z
      .object({
        label: textoOpcional,
        title: textoOpcional,
        body: textoOpcional,
        imagePath: z.string().optional(),
      })
      .loose(),
  ),
})

type Slide = z.infer<typeof slidesSchema>['slides'][number]

/** Os slides da peça, ou lista vazia quando o body não tem slides. */
function slidesOf(body: unknown): Slide[] {
  const parsed = slidesSchema.safeParse(body)
  return parsed.success ? parsed.data.slides : []
}

function templateOf(body: unknown): string | null {
  const parsed = slidesSchema.safeParse(body)
  return (parsed.success && parsed.data.template) || null
}

/**
 * Peças criadas para o Instagram. Serve a tela de Criação e a de Aprovações.
 * O filtro por status é opcional: /content?status=aguardando devolve a fila
 * de aprovação.
 */
/**
 * O que a revisao pode decidir. `aguardando` e `rascunho` ficam de fora: sao
 * para onde a peca vai sozinha ao ser criada, nao decisao de quem revisa.
 */
const reviewSchema = z
  .object({
    status: z.enum(['aprovado', 'ajustar', 'rejeitado']),
    reviewNote: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.status !== 'ajustar' || (v.reviewNote && v.reviewNote.length > 0), {
    message: 'Diga o que precisa mudar. Peça devolvida sem recado não é pedido de ajuste.',
    path: ['reviewNote'],
  })

export function contentRoutes(
  db: Database,
  signAssetUrls: AssetUrlSigner | null,
  removeAssets: AssetRemover | null = null,
): Router {
  const router = Router()

  // Com o caminho na frente: sem ele, `router.use` pegaria tambem o GET abaixo
  // e o funcionario perderia a tela de Criacao inteira.
  router.use('/content/:id/status', requireRole('chefe'))

  router.get('/content', async (req, res) => {
    const { companyId } = req.company!

    const status = contentStatusSchema.safeParse(req.query.status)

    const where = status.success
      ? and(eq(contentItems.companyId, companyId), eq(contentItems.status, status.data))
      : eq(contentItems.companyId, companyId)

    const items = await db
      .select({
        id: contentItems.id,
        type: contentItems.type,
        status: contentItems.status,
        title: contentItems.title,
        caption: contentItems.caption,
        body: contentItems.body,
        reviewNote: contentItems.reviewNote,
        createdAt: contentItems.createdAt,
        authorName: users.fullName,
      })
      .from(contentItems)
      .leftJoin(users, eq(users.id, contentItems.createdByUserId))
      .where(where)
      .orderBy(desc(contentItems.createdAt))

    // Só assina caminho dentro da pasta da empresa da sessão. O body veio do
    // banco já filtrado por companyId, mas um caminho errado gravado ali não
    // pode virar link para a imagem de outra empresa. Regra 3.
    const pasta = `${companyId}/`
    const slides = items.map((item) => slidesOf(item.body))
    const caminhos = [
      ...new Set(
        slides
          .flat()
          .map((s) => s.imagePath)
          .filter((p): p is string => Boolean(p?.startsWith(pasta))),
      ),
    ]

    // Uma chamada ao Storage para a página inteira, não uma por peça.
    const links = signAssetUrls ? await signAssetUrls(caminhos) : []
    const linkPorCaminho = new Map(caminhos.map((caminho, i) => [caminho, links[i] ?? null]))

    const resposta = items.map(({ body, ...item }, n) => {
      const daPeca = slides[n]!.map((s) => ({
        label: s.label,
        title: s.title,
        body: s.body,
        imageUrl: (s.imagePath && linkPorCaminho.get(s.imagePath)) || null,
      }))

      return {
        ...item,
        template: templateOf(body),
        // `images` continua para as telas que só mostram as miniaturas.
        images: daPeca.map((s) => s.imageUrl).filter((u): u is string => u !== null),
        slides: daPeca,
      }
    })

    res.json({ items: resposta })
  })

  /**
   * A decisao do chefe sobre uma peca: aprovar, pedir ajuste ou rejeitar.
   *
   * O filtro por companyId no UPDATE e o que impede uma empresa de mexer na
   * peca de outra. Peca de outra empresa devolve 404 e nao 403: "existe, mas
   * nao e sua" ja entrega informacao que nao e de quem perguntou.
   */
  router.patch('/content/:id/status', async (req, res) => {
    const { companyId } = req.company!

    const corpo = reviewSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error))

    const [item] = await db
      .update(contentItems)
      .set({
        status: corpo.data.status,
        // Aprovar ou rejeitar limpa o recado antigo: ele era sobre o ajuste
        // que foi pedido antes, e nao vale mais.
        reviewNote: corpo.data.status === 'ajustar' ? corpo.data.reviewNote! : null,
        updatedAt: new Date(),
      })
      .where(and(eq(contentItems.id, req.params.id), eq(contentItems.companyId, companyId)))
      .returning()

    if (!item) throw notFound('Essa peça não existe nesta empresa.')

    res.json({ item })
  })

  /**
   * Exclui uma peça e as imagens dela.
   *
   * Qualquer pessoa da empresa pode (decisão do Matheus, 04/11/2026), inclusive
   * peça aprovada — a tela avisa antes. A pauta do Planejamento ligada a ela
   * fica, só perde a ligação (`set null`); o agendamento da peça vai junto
   * (`cascade`).
   *
   * Peça de outra empresa devolve 404, como no PATCH acima.
   */
  router.delete('/content/:id', async (req, res) => {
    const { companyId } = req.company!

    const id = z.uuid().safeParse(req.params.id)
    if (!id.success) throw notFound('Essa peça não existe nesta empresa.')

    const [item] = await db
      .delete(contentItems)
      .where(and(eq(contentItems.id, id.data), eq(contentItems.companyId, companyId)))
      .returning({ body: contentItems.body })

    if (!item) throw notFound('Essa peça não existe nesta empresa.')

    // Só apaga dentro da pasta da empresa, pelo mesmo motivo do GET.
    const pasta = `${companyId}/`
    const caminhos = slidesOf(item.body)
      .map((s) => s.imagePath)
      .filter((p): p is string => Boolean(p?.startsWith(pasta)))

    if (removeAssets) await removeAssets(caminhos)

    res.status(204).end()
  })

  return router
}
