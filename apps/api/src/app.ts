import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './env'
import { healthRouter } from './routes/health'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.WEB_BASE_URL, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  app.use(healthRouter)

  return app
}
