import { waitUntil } from '@vercel/functions'
import { buildServer } from './server'

/**
 * A api como função da Vercel: sem `listen`, a Vercel chama a api a cada
 * requisição.
 *
 * Duas diferenças para o servidor de sempre:
 * - poucas conexões com o banco, porque a Vercel sobe várias cópias da função;
 * - `waitUntil` segura a função ligada enquanto termina o que continua depois
 *   da resposta (a análise do onboarding). Sem isso a Vercel desligaria a
 *   função no meio do trabalho.
 *
 * Solução de enquanto não há VPS (CLAUDE.md: deploy em Docker). Quando o
 * worker e a fila existirem, eles não rodam aqui.
 */
const { app } = buildServer({ maxConnections: 1, runInBackground: waitUntil })

export default app
