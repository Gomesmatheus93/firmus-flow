import type { Database } from '@firmus/db'
import cors from 'cors'
import express, { type Express } from 'express'
import helmet from 'helmet'
import type { TokenVerifier } from './auth/types'
import { errorHandler, notFoundHandler, unavailable } from './http/errors'
import { requireAuth } from './middleware/auth'
import { requireCompany } from './middleware/company'
import { companyRoutes } from './routes/companies'
import { healthRouter } from './routes/health'
import { invitationRoutes } from './routes/invitations'
import { meRoutes } from './routes/me'
import { teamRoutes } from './routes/team'

export type AppDeps = {
  db: Database
  verifyToken: TokenVerifier
  webBaseUrl: string
}

function baseApp(webBaseUrl: string): Express {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: webBaseUrl, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(healthRouter)

  return app
}

export function createApp({ db, verifyToken, webBaseUrl }: AppDeps): Express {
  const app = baseApp(webBaseUrl)

  // Público: quem abre um link de convite ainda não tem conta.
  app.use(invitationRoutes(db, verifyToken))

  // Daqui para baixo, tudo exige login.
  app.use(requireAuth(db, verifyToken))
  app.use(meRoutes(db))
  app.use(companyRoutes(db))

  // E daqui para baixo, também exige pertencer a uma empresa.
  // requireCompany é quem define o company_id de toda consulta abaixo.
  app.use(requireCompany(db))
  app.use(teamRoutes(db, webBaseUrl))

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
