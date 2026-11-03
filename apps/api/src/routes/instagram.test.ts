import { randomBytes } from 'node:crypto'
import { instagramConnections } from '@firmus/db/schema'
import { decrypt } from '@firmus/shared/crypto'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InstagramApiError, type InstagramAccountFetcher } from '../meta/instagram'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let rivalId: string

const TOKEN = 'EAABsbCS1iHgBO7ZCexemploTokenLongoDeTeste123456'

/** Guarda o id que a rota repassou, para o teste conferir. */
let idPedido: string | undefined

/** Meta falsa: aceita o token certo e recusa qualquer outro. */
const metaFalsa: InstagramAccountFetcher = async (token, igAccountId) => {
  idPedido = igAccountId
  if (token !== TOKEN) throw new InstagramApiError('Error validating access token: expired.')

  return {
    id: '17841400000000000',
    username: 'firmustech',
    followersCount: 1234,
    name: 'Firmus Tech',
    profilePictureUrl: null,
  }
}

beforeEach(async () => {
  // A chave da plataforma. Em produção vem do .env.
  process.env.FIRMUS_ENCRYPTION_KEY = randomBytes(32).toString('base64')

  h = await createHarness({ fetchInstagramAccount: metaFalsa })

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

  idPedido = undefined
})

afterEach(async () => {
  await h.close()
  delete process.env.FIRMUS_ENCRYPTION_KEY
})

const conectar = (quem: string, token = TOKEN) =>
  request(h.app).post('/instagram/connection').set(asUser(quem)).send({ accessToken: token })

const ler = (quem: string) => request(h.app).get('/instagram/connection').set(asUser(quem))

const linhaDe = async (companyId: string) => {
  const [l] = await h.db
    .select()
    .from(instagramConnections)
    .where(eq(instagramConnections.companyId, companyId))
  return l
}

describe('conectar', () => {
  it('prova o token na Meta e guarda a conta', async () => {
    const resposta = await conectar('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.account.username).toBe('firmustech')
    expect(resposta.body.account.followersCount).toBe(1234)

    const linha = await linhaDe(auraId)
    expect(linha!.username).toBe('firmustech')
    expect(linha!.igAccountId).toBe('17841400000000000')
  })

  it('o token NÃO fica legível no banco', async () => {
    await conectar('chefe-aura')

    const linha = await linhaDe(auraId)

    // O ponto da tarefa inteira: banco vazado não entrega o Instagram do
    // cliente. O valor guardado não pode conter o token em lugar nenhum.
    expect(linha!.accessTokenCipher).not.toBe(TOKEN)
    expect(linha!.accessTokenCipher).not.toContain(TOKEN)
    expect(JSON.stringify(linha)).not.toContain(TOKEN)

    // E ainda assim a plataforma consegue recuperá-lo quando precisar.
    expect(decrypt(linha!.accessTokenCipher)).toBe(TOKEN)
  })

  it('token recusado pela Meta não grava nada', async () => {
    const resposta = await conectar('chefe-aura', 'token-velho-que-a-meta-nao-aceita')

    expect(resposta.status).toBe(400)
    expect(resposta.body.error.code).toBe('token_recusado')
    // A mensagem da Meta chega até a tela, com a pista do que houve.
    expect(resposta.body.error.message).toContain('expired')

    expect(await linhaDe(auraId)).toBeUndefined()
  })

  it('conectar de novo troca a conta, sem criar uma segunda linha', async () => {
    await conectar('chefe-aura')
    await conectar('chefe-aura')

    const todas = await h.db
      .select()
      .from(instagramConnections)
      .where(eq(instagramConnections.companyId, auraId))

    expect(todas).toHaveLength(1)
  })

  it('repassa o ID da conta quando informado', async () => {
    // O caminho certo quando a descoberta automatica nao da conta: com o id,
    // a consulta vai direto na conta em vez de adivinhar.
    const resposta = await request(h.app)
      .post('/instagram/connection')
      .set(asUser('chefe-aura'))
      .send({ accessToken: TOKEN, igAccountId: '17841459743823633' })

    expect(resposta.status).toBe(200)
    expect(idPedido).toBe('17841459743823633')
  })

  it('sem o ID, deixa a api descobrir', async () => {
    await conectar('chefe-aura')

    expect(idPedido).toBeUndefined()
  })

  it('ID com letra é recusado', async () => {
    const resposta = await request(h.app)
      .post('/instagram/connection')
      .set(asUser('chefe-aura'))
      .send({ accessToken: TOKEN, igAccountId: 'abc123' })

    expect(resposta.status).toBe(400)
  })

  it('token curto é recusado antes de chamar a Meta', async () => {
    const resposta = await conectar('chefe-aura', 'curto')

    expect(resposta.status).toBe(400)
    expect(resposta.body.error.code).not.toBe('token_recusado')
  })
})

describe('ler a conexão', () => {
  it('devolve o @ e nunca o token, nem cifrado', async () => {
    await conectar('chefe-aura')

    const resposta = await ler('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.connection.username).toBe('firmustech')

    const corpo = JSON.stringify(resposta.body)
    expect(corpo).not.toContain(TOKEN)
    expect(corpo).not.toContain('accessTokenCipher')
  })

  it('sem conexão, devolve nulo em vez de erro', async () => {
    const resposta = await ler('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.connection).toBeNull()
  })
})

describe('desconectar', () => {
  it('apaga a ligação', async () => {
    await conectar('chefe-aura')

    const resposta = await request(h.app).delete('/instagram/connection').set(asUser('chefe-aura'))

    expect(resposta.status).toBe(204)
    expect(await linhaDe(auraId)).toBeUndefined()
  })
})

describe('quem pode mexer', () => {
  it('o funcionário não conecta', async () => {
    const resposta = await conectar('func-aura')

    expect(resposta.status).toBe(403)
    expect(await linhaDe(auraId)).toBeUndefined()
  })

  it('e o funcionário continua usando o resto da plataforma', async () => {
    // Os dois lados, como a lição do 403 ensinou.
    const resposta = await request(h.app).get('/brand').set(asUser('func-aura'))

    expect(resposta.status).toBe(200)
  })

  it('o operador da Firmus é barrado: credencial não é dado de suporte', async () => {
    const resposta = await request(h.app)
      .post('/instagram/connection')
      .set(asUser('operador'))
      .set({ 'x-firmus-company': auraId })
      .send({ accessToken: TOKEN })

    expect(resposta.status).toBe(403)
    expect(await linhaDe(auraId)).toBeUndefined()
  })
})

describe('isolamento entre empresas', () => {
  it('uma empresa não enxerga a conexão da outra', async () => {
    await conectar('chefe-aura')

    const resposta = await ler('chefe-rival')

    expect(resposta.body.connection).toBeNull()
  })

  it('e não apaga a da outra', async () => {
    await conectar('chefe-aura')

    await request(h.app).delete('/instagram/connection').set(asUser('chefe-rival'))

    expect(await linhaDe(auraId)).toBeDefined()
    expect(await linhaDe(rivalId)).toBeUndefined()
  })
})

describe('sem a chave de cifra', () => {
  it('devolve 503 dizendo o que falta, em vez de guardar em texto puro', async () => {
    delete process.env.FIRMUS_ENCRYPTION_KEY

    const resposta = await conectar('chefe-aura')

    expect(resposta.status).toBe(503)
    expect(resposta.body.error.code).toBe('sem_chave_de_cifra')
    expect(await linhaDe(auraId)).toBeUndefined()
  })
})
