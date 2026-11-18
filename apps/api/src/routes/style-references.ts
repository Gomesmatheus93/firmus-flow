import { randomUUID } from 'node:crypto'
import { readStyleReference } from '@firmus/agents/referencia'
import type { ModelClient } from '@firmus/agents/runtime'
import type { Database } from '@firmus/db'
import { brandStyleReferences } from '@firmus/db/schema'
import { and, asc, count, eq } from 'drizzle-orm'
import express, { type ErrorRequestHandler, Router } from 'express'
import { z } from 'zod'
import { AppError, badRequest, conflict, notFound, unavailable } from '../http/errors'
import { requireRole } from '../middleware/role'
import { usdBrlRate } from '../money/ptax'
import type { AssetRemover, AssetUploader, AssetUrlSigner } from '../storage/supabase'

/** Até 5 MB por imagem: um print de tela em boa resolução cabe com folga. */
const IMAGEM_MAX = 5 * 1024 * 1024

const TIPOS = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' } as const
type Tipo = keyof typeof TIPOS

/**
 * Quantas referências uma empresa guarda. Cada guia entra no prompt de todo
 * agente: mais que isso dilui o estilo e encarece toda chamada de IA.
 */
export const MAX_REFERENCIAS = 6

/** Confere se o arquivo é mesmo a imagem que diz ser, olhando o começo dele. */
export function imagemValida(arquivo: Buffer, tipo: Tipo): boolean {
  const inicio = (bytes: number[]) => arquivo.subarray(0, bytes.length).equals(Buffer.from(bytes))

  if (tipo === 'image/png') return inicio([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (tipo === 'image/jpeg') return inicio([0xff, 0xd8, 0xff])
  // WebP: "RIFF", quatro bytes de tamanho, "WEBP".
  return (
    arquivo.subarray(0, 4).toString('latin1') === 'RIFF' &&
    arquivo.subarray(8, 12).toString('latin1') === 'WEBP'
  )
}

type Deps = {
  db: Database
  aiClient: ModelClient | null
  uploadAsset: AssetUploader | null
  signAssetUrls: AssetUrlSigner | null
  removeAssets: AssetRemover | null
}

/**
 * As referências de design do Cérebro da Marca ("Enviar template").
 *
 * O chefe envia a imagem de um design de que gosta; o agente `referencia` tira
 * dela um guia de estilo, que passa a entrar no prompt de todo agente.
 * Ler é de todos da empresa; enviar e apagar é do chefe, como o resto da
 * configuração da marca.
 */
export function styleReferenceRoutes({
  db,
  aiClient,
  uploadAsset,
  signAssetUrls,
  removeAssets,
}: Deps): Router {
  const router = Router()

  router.get('/brand/style-references', async (req, res) => {
    const { companyId } = req.company!

    const linhas = await db
      .select()
      .from(brandStyleReferences)
      .where(eq(brandStyleReferences.companyId, companyId))
      .orderBy(asc(brandStyleReferences.createdAt))

    const urls = signAssetUrls
      ? await signAssetUrls(linhas.map((l) => l.imagePath))
      : linhas.map(() => null)

    res.json({
      references: linhas.map((l, i) => ({
        id: l.id,
        imageUrl: urls[i] ?? null,
        guide: l.guide,
        createdAt: l.createdAt,
      })),
      max: MAX_REFERENCIAS,
    })
  })

  /** A imagem vem como o próprio arquivo no corpo (PNG, JPG ou WebP, até 5 MB). */
  router.post(
    '/brand/style-references',
    requireRole('chefe'),
    express.raw({ type: Object.keys(TIPOS), limit: IMAGEM_MAX }),
    async (req, res) => {
      const { companyId } = req.company!

      if (!aiClient) {
        throw unavailable(
          'A IA ainda não está configurada. Preencha ANTHROPIC_API_KEY no .env da raiz.',
          'ia_nao_configurada',
        )
      }
      if (!uploadAsset) {
        throw unavailable(
          'O envio de arquivos ainda não está configurado. Preencha SUPABASE_SERVICE_ROLE_KEY no .env da raiz.',
          'storage_nao_configurado',
        )
      }

      const tipo = req.headers['content-type']?.split(';')[0]?.trim() as Tipo
      if (!(tipo in TIPOS) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw badRequest('Envie a referência em PNG, JPG ou WebP.', 'referencia_tipo_invalido')
      }
      if (!imagemValida(req.body, tipo)) {
        throw badRequest(
          'Esse arquivo não parece uma imagem PNG, JPG ou WebP válida.',
          'referencia_tipo_invalido',
        )
      }

      const [{ total }] = (await db
        .select({ total: count() })
        .from(brandStyleReferences)
        .where(eq(brandStyleReferences.companyId, companyId))) as [{ total: number }]

      if (total >= MAX_REFERENCIAS) {
        throw conflict(
          `Já existem ${MAX_REFERENCIAS} referências. Apague uma antes de enviar outra.`,
          'limite_de_referencias',
        )
      }

      // A IA vem antes do Storage, de propósito: se ela falhar, nada foi
      // salvo e não sobra imagem sem guia no bucket.
      const { guide } = await readStyleReference({
        db,
        client: aiClient,
        usdBrlRate: () => usdBrlRate(db),
        companyId,
        image: { mediaType: tipo, data: req.body.toString('base64') },
      })

      const id = randomUUID()
      const imagePath = `${companyId}/referencias/${id}.${TIPOS[tipo]}`
      await uploadAsset(imagePath, req.body, tipo)

      const [linha] = await db
        .insert(brandStyleReferences)
        .values({ id, companyId, imagePath, guide })
        .returning()

      const [imageUrl] = signAssetUrls ? await signAssetUrls([imagePath]) : [null]

      res.status(201).json({
        reference: {
          id: linha!.id,
          imageUrl: imageUrl ?? null,
          guide: linha!.guide,
          createdAt: linha!.createdAt,
        },
      })
    },
  )

  router.delete('/brand/style-references/:id', requireRole('chefe'), async (req, res) => {
    const { companyId } = req.company!

    // Id que nem é uuid derrubaria a consulta com erro 500; é só "não existe".
    if (!z.uuid().safeParse(req.params.id).success) {
      throw notFound('Essa referência não existe.', 'referencia_nao_encontrada')
    }

    // O filtro por empresa é o que impede apagar a referência de outra empresa
    // adivinhando o id.
    const [apagada] = await db
      .delete(brandStyleReferences)
      .where(
        and(
          eq(brandStyleReferences.id, String(req.params.id)),
          eq(brandStyleReferences.companyId, companyId),
        ),
      )
      .returning({ imagePath: brandStyleReferences.imagePath })

    if (!apagada) throw notFound('Essa referência não existe.', 'referencia_nao_encontrada')

    if (removeAssets) await removeAssets([apagada.imagePath])

    res.status(204).end()
  })

  // Arquivo acima do limite: resposta em português em vez de erro genérico.
  const tamanho: ErrorRequestHandler = (erro, _req, _res, next) => {
    if ((erro as { type?: string } | null)?.type === 'entity.too.large') {
      next(new AppError(413, 'A referência pode ter até 5 MB.', 'referencia_grande_demais'))
      return
    }
    next(erro)
  }
  router.use('/brand/style-references', tamanho)

  return router
}
