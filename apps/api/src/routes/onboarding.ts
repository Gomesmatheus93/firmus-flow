import { buildBrandBrain } from '@firmus/agents/marca'
import type { ModelClient } from '@firmus/agents/runtime'
import type { Database } from '@firmus/db'
import { brandBrains, brandOnboardings, type BrandOnboarding } from '@firmus/db/schema'
import {
  answersToDescription,
  isBrainComplete,
  ONBOARDING_KEYS,
  onboardingAnswerSchema,
  onboardingConfirmSchema,
  onboardingVisualSchema,
} from '@firmus/shared'
import { eq } from 'drizzle-orm'
import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import { z } from 'zod'
import { AppError, badRequest, conflict, forbidden } from '../http/errors'
import { requireRole } from '../middleware/role'
import { usdBrlRate } from '../money/ptax'
import type { AssetUploader, AssetUrlSigner } from '../storage/supabase'

export type OnboardingDeps = {
  db: Database
  aiClient: ModelClient | null
  signAssetUrls: AssetUrlSigner | null
  uploadAsset: AssetUploader | null
}

/** O logo: até 5 MB, PNG ou SVG. */
const LOGO_MAX = 5 * 1024 * 1024
const LOGO_TIPOS = { 'image/png': 'png', 'image/svg+xml': 'svg' } as const

/**
 * Operador da Firmus vendo a empresa não responde por ela. O onboarding é a
 * voz do dono — quem grava é o chefe da própria empresa.
 */
const somenteChefeDaEmpresa: RequestHandler = (req, _res, next) => {
  if (req.company?.asOperator) {
    next(forbidden('Só o chefe da empresa responde o onboarding.', 'onboarding_so_do_chefe'))
    return
  }
  next()
}

/** Confere se o arquivo é mesmo o que diz ser, olhando o começo dele. */
function logoValido(arquivo: Buffer, tipo: keyof typeof LOGO_TIPOS): boolean {
  if (tipo === 'image/png') {
    return arquivo
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  }
  const texto = arquivo.toString('utf8')
  // SVG é texto e pode carregar script. Ele só é mostrado como <img>, onde
  // script não roda, mas não há motivo para guardar um.
  return /<svg[\s>]/i.test(texto.slice(0, 2048)) && !/<script|\son\w+\s*=/i.test(texto)
}

/** A linha da empresa, criada vazia na primeira visita. */
async function carregar(db: Database, companyId: string): Promise<BrandOnboarding> {
  const [linha] = await db
    .select()
    .from(brandOnboardings)
    .where(eq(brandOnboardings.companyId, companyId))
    .limit(1)
  if (linha) return linha

  const [nova] = await db
    .insert(brandOnboardings)
    .values({ companyId })
    .onConflictDoNothing()
    .returning()
  return nova ?? (await carregar(db, companyId))
}

/**
 * A IA recusou por conta (sem crédito, chave inválida ou sem permissão), e não
 * pelo pedido. Tentar de novo não muda nada até alguém mexer na conta.
 */
export function iaIndisponivel(erro: unknown): boolean {
  const status = (erro as { status?: number } | null)?.status
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return status === 401 || status === 403 || /credit balance|billing|api key/i.test(mensagem)
}

/**
 * Roda o agente `marca` com as quatro respostas e guarda o rascunho para a
 * revisão do chefe.
 *
 * Roda em segundo plano: a rota responde na hora e a tela pergunta de tempos
 * em tempos se terminou. Quando a fila (BullMQ) existir, esta função vira o
 * corpo do job, sem mudar a rota nem a tela.
 */
export async function gerarCerebro(
  db: Database,
  client: ModelClient,
  companyId: string,
  answers: BrandOnboarding['answers'],
): Promise<void> {
  try {
    const { draft } = await buildBrandBrain({
      db,
      client,
      usdBrlRate: () => usdBrlRate(db),
      companyId,
      description: answersToDescription(answers),
    })

    await db
      .update(brandOnboardings)
      .set({ status: 'revisao', draft, errorMessage: null, updatedAt: new Date() })
      .where(eq(brandOnboardings.companyId, companyId))
  } catch (erro) {
    console.error('[api] o agente marca falhou no onboarding:', erro)

    // Sem crédito ou chave recusada não passa tentando de novo: é a conta da
    // IA, não a análise. Vai como `sem_ia`, que deixa o chefe seguir.
    const semIa = iaIndisponivel(erro)
    await db
      .update(brandOnboardings)
      .set({
        status: semIa ? 'sem_ia' : 'erro',
        errorMessage: semIa
          ? 'A conta da IA da plataforma está sem crédito. Assim que o crédito entrar, o Cérebro é montado a partir destas respostas.'
          : 'Não conseguimos analisar agora. Suas respostas estão salvas; tente de novo.',
        updatedAt: new Date(),
      })
      .where(eq(brandOnboardings.companyId, companyId))
  }
}

export function onboardingRoutes({
  db,
  aiClient,
  signAssetUrls,
  uploadAsset,
}: OnboardingDeps): Router {
  const router = Router()

  // Ler é de qualquer pessoa da empresa; gravar é só do chefe dela.
  const gravacao = [requireRole('chefe'), somenteChefeDaEmpresa]

  /** O estado do onboarding e se o Cérebro já está completo. */
  router.get('/onboarding', async (req, res) => {
    const { companyId } = req.company!
    const linha = await carregar(db, companyId)

    const [brain] = await db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, companyId))
      .limit(1)

    const logoPath = linha.visual?.logoPath ?? null
    const [logoUrl] =
      logoPath && logoPath.startsWith(`${companyId}/`) && signAssetUrls
        ? await signAssetUrls([logoPath])
        : [null]

    res.json({
      brainComplete: isBrainComplete(brain ?? null),
      onboarding: {
        currentStep: linha.currentStep,
        answers: linha.answers,
        visual: {
          colors: linha.visual?.colors ?? [],
          instagram: linha.visual?.instagram ?? '',
          logoUrl: logoUrl ?? null,
        },
        status: linha.status,
        draft: linha.status === 'revisao' ? linha.draft : null,
        errorMessage: linha.errorMessage,
      },
    })
  })

  /**
   * Grava a resposta de um passo (1 a 4).
   *
   * Os passos vão em ordem: não dá para responder o 3 sem o 1 e o 2. Voltar e
   * editar um passo anterior pode sempre.
   */
  router.put('/onboarding/passo/:passo', ...gravacao, async (req, res) => {
    const { companyId } = req.company!

    const passo = z.coerce.number().int().min(1).max(4).safeParse(req.params.passo)
    if (!passo.success) throw badRequest('Passo inválido.', 'passo_invalido')

    const corpo = z.object({ answer: onboardingAnswerSchema }).safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error), 'resposta_invalida')

    const linha = await carregar(db, companyId)
    const anteriores = ONBOARDING_KEYS.slice(0, passo.data - 1)
    if (anteriores.some((k) => !linha.answers[k])) {
      throw conflict('Responda os passos anteriores primeiro.', 'passo_fora_de_ordem')
    }

    const chave = ONBOARDING_KEYS[passo.data - 1]!
    const [salva] = await db
      .update(brandOnboardings)
      .set({
        answers: { ...linha.answers, [chave]: corpo.data.answer },
        currentStep: Math.max(linha.currentStep, passo.data + 1),
        // Editar uma resposta depois da revisão pede nova análise.
        status: 'respondendo',
        draft: null,
        updatedAt: new Date(),
      })
      .where(eq(brandOnboardings.companyId, companyId))
      .returning({ currentStep: brandOnboardings.currentStep })

    res.json({ currentStep: salva!.currentStep })
  })

  /** Cores e @ do Instagram: o passo extra, opcional. */
  router.put('/onboarding/visual', ...gravacao, async (req, res) => {
    const { companyId } = req.company!

    const corpo = onboardingVisualSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error), 'visual_invalido')

    const linha = await carregar(db, companyId)
    await db
      .update(brandOnboardings)
      .set({
        visual: { ...corpo.data, logoPath: linha.visual?.logoPath ?? null },
        updatedAt: new Date(),
      })
      .where(eq(brandOnboardings.companyId, companyId))

    res.status(204).end()
  })

  /** O logo, enviado como o próprio arquivo no corpo (PNG ou SVG, até 5 MB). */
  router.post(
    '/onboarding/logo',
    ...gravacao,
    express.raw({ type: Object.keys(LOGO_TIPOS), limit: LOGO_MAX }),
    async (req, res) => {
      const { companyId } = req.company!

      if (!uploadAsset) {
        throw new AppError(
          503,
          'O envio de arquivos ainda não está configurado.',
          'storage_nao_configurado',
        )
      }

      const tipo = req.headers['content-type']?.split(';')[0]?.trim() as keyof typeof LOGO_TIPOS
      if (!(tipo in LOGO_TIPOS) || !Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw badRequest('Envie o logo em PNG ou SVG.', 'logo_tipo_invalido')
      }
      if (!logoValido(req.body, tipo)) {
        throw badRequest('Esse arquivo não parece um PNG ou SVG válido.', 'logo_tipo_invalido')
      }

      const logoPath = `${companyId}/marca/logo.${LOGO_TIPOS[tipo]}`
      await uploadAsset(logoPath, req.body, tipo)

      const linha = await carregar(db, companyId)
      await db
        .update(brandOnboardings)
        .set({
          visual: {
            colors: linha.visual?.colors ?? [],
            instagram: linha.visual?.instagram ?? '',
            logoPath,
          },
          updatedAt: new Date(),
        })
        .where(eq(brandOnboardings.companyId, companyId))

      const [logoUrl] = signAssetUrls ? await signAssetUrls([logoPath]) : [null]
      res.json({ logoUrl: logoUrl ?? null })
    },
  )

  /**
   * Fecha as respostas e pede a análise ao agente.
   *
   * Responde na hora com o novo estado; a análise roda em segundo plano.
   */
  router.post('/onboarding/concluir', ...gravacao, async (req, res) => {
    const { companyId } = req.company!
    const linha = await carregar(db, companyId)

    if (ONBOARDING_KEYS.some((k) => !linha.answers[k])) {
      throw conflict('Responda as quatro perguntas antes de concluir.', 'onboarding_incompleto')
    }
    if (linha.status === 'gerando') {
      res.json({ status: 'gerando' })
      return
    }

    // Sem IA, as respostas ficam salvas e a tela explica o que falta.
    const status = aiClient ? 'gerando' : 'sem_ia'
    await db
      .update(brandOnboardings)
      .set({ status, currentStep: 5, draft: null, errorMessage: null, updatedAt: new Date() })
      .where(eq(brandOnboardings.companyId, companyId))

    if (aiClient) void gerarCerebro(db, aiClient, companyId, linha.answers)

    res.status(202).json({ status })
  })

  /**
   * O chefe confirma (e talvez editou) o resumo: vira o Cérebro da Marca.
   *
   * Grava só o que o onboarding cuida. FAQ vem do rascunho do agente; cor, logo
   * e @ vêm do passo visual, quando preenchido.
   */
  router.post('/onboarding/confirmar', ...gravacao, async (req, res) => {
    const { companyId } = req.company!
    const linha = await carregar(db, companyId)

    if (linha.status !== 'revisao' || !linha.draft) {
      throw conflict('Não há resumo esperando confirmação.', 'nada_para_confirmar')
    }

    const corpo = onboardingConfirmSchema.safeParse(req.body)
    if (!corpo.success) throw badRequest(z.prettifyError(corpo.error), 'resumo_invalido')

    const visual = linha.visual
    const campos = {
      ...corpo.data,
      faq: linha.draft.faq,
      ...(visual?.colors.length ? { colorPalette: visual.colors } : {}),
      ...(visual?.instagram ? { instagramHandle: visual.instagram } : {}),
      ...(visual?.logoPath ? { logoUrl: visual.logoPath } : {}),
      updatedAt: new Date(),
    }

    await db
      .insert(brandBrains)
      .values({ companyId, ...campos })
      .onConflictDoUpdate({ target: brandBrains.companyId, set: campos })

    await db
      .update(brandOnboardings)
      .set({ status: 'concluido', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(brandOnboardings.companyId, companyId))

    res.json({ status: 'concluido' })
  })

  // Arquivo acima do limite: resposta em português em vez de erro genérico.
  const tamanho: ErrorRequestHandler = (erro, _req, _res, next) => {
    if (erro?.type === 'entity.too.large') {
      next(new AppError(413, 'O logo pode ter até 5 MB.', 'logo_grande_demais'))
      return
    }
    next(erro)
  }
  router.use('/onboarding/logo', tamanho)

  return router
}
