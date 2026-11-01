import { randomBytes } from 'node:crypto'
import { instagramConnections, instagramMetrics } from '@firmus/db/schema'
import { encrypt } from '@firmus/shared/crypto'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { InstagramInsights, InstagramInsightsFetcher } from '../meta/instagram'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let rivalId: string

const TOKEN = 'EAABsbCS1iHgBO7ZCexemploTokenLongoDeTeste123456'

/** O que a Meta devolve, quando tudo dá certo. */
const tudoCerto: InstagramInsights = {
  followers: 1234,
  reach: 500,
  views: 820,
  accountsEngaged: 60,
  interactions: 140,
  recusadas: [],
}

let resposta: InstagramInsights = tudoCerto
/** Guarda o token que a rota repassou, para provar que foi decifrado. */
let tokenRecebido: string | undefined

const metaFalsa: InstagramInsightsFetcher = async (token) => {
  tokenRecebido = token
  return resposta
}

async function conectarNoBanco(companyId: string) {
  await h.db.insert(instagramConnections).values({
    companyId,
    igAccountId: '17841459743823633',
    username: 'somosfirmus',
    accessTokenCipher: encrypt(TOKEN),
  })
}

beforeEach(async () => {
  process.env.FIRMUS_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  resposta = tudoCerto
  tokenRecebido = undefined

  h = await createHarness({ fetchInstagramInsights: metaFalsa })

  const aura = await h.createCompanyWithBoss({
    companyName: 'Studio Aura',
    userId: 'chefe-aura',
    email: 'chefe@aura.com',
    fullName: 'Chefe da Aura',
  })
  auraId = aura.companyId

  await h.addMember({
    companyId: auraId,
    userId: 'func-aura',
    email: 'func@aura.com',
    fullName: 'Funcionária da Aura',
    role: 'funcionario',
  })

  const rival = await h.createCompanyWithBoss({
    companyName: 'Clínica Rival',
    userId: 'chefe-rival',
    email: 'chefe@rival.com',
    fullName: 'Chefe da Rival',
  })
  rivalId = rival.companyId

  await h.addOperator({ userId: 'operador', email: 'suporte@firmus.tech', fullName: 'Suporte' })
})

afterEach(async () => {
  await h.close()
  delete process.env.FIRMUS_ENCRYPTION_KEY
})

const atualizar = (quem: string) => request(h.app).post('/metrics/refresh').set(asUser(quem))

const diasDe = (companyId: string) =>
  h.db.select().from(instagramMetrics).where(eq(instagramMetrics.companyId, companyId))

describe('atualizar as métricas', () => {
  it('decifra o token para chamar a Meta', async () => {
    await conectarNoBanco(auraId)

    await atualizar('chefe-aura')

    // A prova de que a ida e volta da cifra funciona no caminho de produção.
    expect(tokenRecebido).toBe(TOKEN)
  })

  it('guarda o dia com os números', async () => {
    await conectarNoBanco(auraId)

    const r = await atualizar('chefe-aura')

    expect(r.status).toBe(200)

    const [dia] = await diasDe(auraId)
    expect(dia!.followers).toBe(1234)
    expect(dia!.reach).toBe(500)
    expect(dia!.views).toBe(820)
    expect(dia!.accountsEngaged).toBe(60)
    expect(dia!.interactions).toBe(140)
  })

  it('atualizar duas vezes no mesmo dia corrige a linha, não cria outra', async () => {
    await conectarNoBanco(auraId)

    await atualizar('chefe-aura')
    resposta = { ...tudoCerto, reach: 999 }
    await atualizar('chefe-aura')

    const dias = await diasDe(auraId)
    expect(dias).toHaveLength(1)
    expect(dias[0]!.reach).toBe(999)
  })

  it('o número de seguidores também vai para a conexão', async () => {
    await conectarNoBanco(auraId)

    await atualizar('chefe-aura')

    const [ligacao] = await h.db
      .select()
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, auraId))

    expect(ligacao!.followersCount).toBe(1234)
    expect(ligacao!.lastVerifiedAt).not.toBeNull()
  })
})

describe('quando a Meta recusa uma métrica', () => {
  it('guarda as que vieram e relata a que faltou', async () => {
    await conectarNoBanco(auraId)

    // É o caso real: `reach` tem data de aposentadoria marcada, e métrica de
    // seguidor não funciona em conta com menos de 100 seguidores. Uma recusa
    // não pode zerar a coleta inteira.
    resposta = {
      ...tudoCerto,
      reach: null,
      recusadas: [{ metrica: 'reach', motivo: 'metric not supported' }],
    }

    const r = await atualizar('chefe-aura')

    expect(r.status).toBe(200)
    expect(r.body.refused).toEqual([{ metrica: 'reach', motivo: 'metric not supported' }])

    const [dia] = await diasDe(auraId)
    expect(dia!.reach).toBeNull()
    // As outras continuam lá.
    expect(dia!.views).toBe(820)
    expect(dia!.interactions).toBe(140)
  })

  it('conta nova sem número nenhum ainda grava a linha do dia', async () => {
    await conectarNoBanco(auraId)

    resposta = {
      followers: 3,
      reach: null,
      views: null,
      accountsEngaged: null,
      interactions: null,
      recusadas: [{ metrica: 'reach', motivo: 'sem dado para este dia' }],
    }

    const r = await atualizar('chefe-aura')

    expect(r.status).toBe(200)
    expect((await diasDe(auraId))[0]!.followers).toBe(3)
  })
})

describe('sem Instagram conectado', () => {
  it('devolve 400 dizendo para conectar antes', async () => {
    const r = await atualizar('chefe-aura')

    expect(r.status).toBe(400)
    expect(r.body.error.code).toBe('sem_conexao_instagram')
    expect(await diasDe(auraId)).toHaveLength(0)
  })
})

describe('quem pode atualizar', () => {
  it('o funcionário não atualiza', async () => {
    await conectarNoBanco(auraId)

    expect((await atualizar('func-aura')).status).toBe(403)
    expect(await diasDe(auraId)).toHaveLength(0)
  })

  it('mas continua lendo as métricas', async () => {
    await conectarNoBanco(auraId)
    await atualizar('chefe-aura')

    const r = await request(h.app).get('/metrics').set(asUser('func-aura'))

    expect(r.status).toBe(200)
    expect(r.body.days).toHaveLength(1)
  })

  it('o operador da Firmus é barrado', async () => {
    await conectarNoBanco(auraId)

    const r = await request(h.app)
      .post('/metrics/refresh')
      .set(asUser('operador'))
      .set({ 'x-firmus-company': auraId })

    expect(r.status).toBe(403)
  })
})

describe('isolamento entre empresas', () => {
  it('atualizar numa empresa não escreve métrica na outra', async () => {
    await conectarNoBanco(auraId)
    await conectarNoBanco(rivalId)

    await atualizar('chefe-aura')

    expect(await diasDe(auraId)).toHaveLength(1)
    expect(await diasDe(rivalId)).toHaveLength(0)
  })
})
