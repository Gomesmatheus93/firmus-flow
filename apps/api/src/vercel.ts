import { waitUntil } from '@vercel/functions'
import express from 'express'
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
 * Responde nos dois jeitos de publicar:
 * - tudo junto (vercel.json da raiz): a web e a api no mesmo endereço, a api
 *   em `/api/...`. O `/api` sai antes de chegar nas rotas;
 * - separado (apps/api/vercel.json): a api sozinha, rotas na raiz.
 *
 * Solução de enquanto não há VPS (CLAUDE.md: deploy em Docker).
 */
const { app } = buildServer({ maxConnections: 1, runInBackground: waitUntil })

const entrada = express()
entrada.use('/api', app)
entrada.use(app)

export default entrada
