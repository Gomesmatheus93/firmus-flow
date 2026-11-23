import { timingSafeEqual } from 'node:crypto'
import { Router } from 'express'
import { unauthorized, unavailable } from '../http/errors'
import { publishDuePosts, type PublishingDeps } from '../publishing/run'

/** Compara sem vazar pelo tempo quantos caracteres bateram. */
function mesmaSenha(recebida: string, esperada: string): boolean {
  const a = Buffer.from(recebida)
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * A checagem de agendados para quem não tem um processo sempre ligado (a
 * Vercel). Um agendador de fora chama `GET /cron/publicar` a cada minuto com
 * `Authorization: Bearer <CRON_SECRET>` e a api publica o que venceu.
 *
 * Sem `CRON_SECRET` no .env a rota fica desligada: sem senha, qualquer um na
 * internet poderia disparar publicações.
 */
export function cronRoutes(publishing: PublishingDeps | null): Router {
  const router = Router()

  router.get('/cron/publicar', async (req, res) => {
    const segredo = process.env.CRON_SECRET
    if (!segredo)
      throw unavailable('Defina CRON_SECRET no .env para ligar a checagem.', 'cron_desligado')

    const recebida = req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? ''
    if (!mesmaSenha(recebida, segredo)) throw unauthorized('Senha do agendador inválida.')

    if (!publishing) {
      throw unavailable('O Storage não está configurado: sem ele não há arte para publicar.')
    }

    const publicadas = await publishDuePosts(publishing)
    res.json({ processadas: publicadas })
  })

  return router
}
