import { createApp } from './app'
import { env } from './env'

createApp().listen(env.API_PORT, () => {
  console.log(`[api] Firmus Flow rodando em http://localhost:${env.API_PORT}`)
})
