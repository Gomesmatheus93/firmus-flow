import type { ModelClient } from '@firmus/agents/runtime'
import type { Database } from '@firmus/db'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { TokenVerifier } from './auth/types'
import { errorHandler, notFoundHandler, unavailable } from './http/errors'
import { requireAuth } from './middleware/auth'
import { requireCompany } from './middleware/company'
import { commentRuleRoutes } from './routes/comment-rules'
import { adminRoutes } from './routes/admin'
import { brandRoutes } from './routes/brand'
import { companyRoutes } from './routes/companies'
import { companySettingsRoutes } from './routes/company-settings'
import { contentRoutes } from './routes/content'
import { healthRouter } from './routes/health'
import { invitationRoutes } from './routes/invitations'
import { meRoutes } from './routes/me'
import { metricRoutes } from './routes/metrics'
import { planRoutes } from './routes/plan'
import { scheduledPostRoutes } from './routes/scheduled-posts'
import { supportRoutes } from './routes/support'
import { teamRoutes } from './routes/team'
import { trendRoutes } from './routes/trends'

export type AppDeps = {
  db: Database
  verifyToken: TokenVerifier
  webBaseUrl: string
  /**
   * Cliente da Anthropic, ou `null` quando a chave não está no .env.
   *
   * Recebido por parâmetro como todo o resto: é o que deixa o teste rodar os
   * agentes sem rede e sem gastar dinheiro de verdade.
   */
  aiClient?: ModelClient | null
}

function baseApp(webBaseUrl: string): Express {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: webBaseUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(healthRouter)

  return app
}

export function createApp({ db, verifyToken, webBaseUrl, aiClient = null }: AppDeps): Express {
  const app = baseApp(webBaseUrl)

  // Público: quem abre um link de convite ainda não tem conta.
  app.use(invitationRoutes(db, verifyToken))

  // Daqui para baixo, tudo exige login.
  app.use(requireAuth(db, verifyToken))
  app.use(adminRoutes(db))
  app.use(meRoutes(db))
  app.use(companyRoutes(db))

  // E daqui para baixo, também exige pertencer a uma empresa.
  // requireCompany é quem define o company_id de toda consulta abaixo.
  app.use(requireCompany(db))
  app.use(teamRoutes(db, webBaseUrl))
  app.use(companySettingsRoutes(db))
  app.use(brandRoutes(db, aiClient))
  app.use(contentRoutes(db))
  app.use(planRoutes(db))
  app.use(trendRoutes(db))
  app.use(scheduledPostRoutes(db))
  app.use(commentRuleRoutes(db))
  app.use(metricRoutes(db))
  app.use(supportRoutes(db))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

/**
 * Versão reduzida, para quando o .env ainda não tem Supabase nem banco.
 * /health responde normalmente; o resto explica o que falta preencher.
 */
export function createUnconfiguredApp(webBaseUrl: string, missing: string[]): Express {
  const app = baseApp(webBaseUrl)

  app.use(() => {
    throw unavailable(
      `A api ainda não está configurada. Preencha no .env da raiz: ${missing.join(', ')}.`,
      'api_nao_configurada',
    )
  })

  app.use(errorHandler)

  return app
}
