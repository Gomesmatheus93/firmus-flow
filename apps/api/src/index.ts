import { env } from './env'
import { publishDuePosts } from './publishing/run'
import { buildServer } from './server'

/** O servidor de sempre: no computador (`pnpm dev`) e, depois, no Docker da VPS. */
const { app, missing, aiClient, publishing } = buildServer()

app.listen(env.API_PORT, () => {
  console.log(`[api] Firmus Flow rodando em http://localhost:${env.API_PORT}`)

  if (missing.length > 0) {
    console.warn(
      `[api] Faltam variáveis no .env da raiz: ${missing.join(', ')}.\n` +
        '      Só GET /health funciona até você preenchê-las.',
    )
  }

  if (!aiClient) {
    console.warn(
      '[api] Sem credencial da Anthropic: os agentes devolvem 503. ' +
        'Preencha ANTHROPIC_API_KEY no .env da raiz.',
    )
  }
})

/**
 * Os agendados: a cada minuto, publica o que já passou da hora. Só no servidor
 * de sempre, que fica ligado; na Vercel quem chama é o agendador de fora
 * (`GET /cron/publicar`).
 */
if (publishing) {
  const checar = () =>
    publishDuePosts(publishing)
      .then((n) => n > 0 && console.log(`[api] agendados: ${n} processado(s)`))
      .catch((erro) => console.error('[api] erro ao publicar agendados:', erro))
  setTimeout(checar, 5_000)
  setInterval(checar, 60_000)
}
