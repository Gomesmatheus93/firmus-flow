import { randomBytes } from 'node:crypto'
import { contentItems, instagramConnections, scheduledPosts } from '@firmus/db/schema'
import { encrypt } from '@firmus/shared/crypto'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { InstagramApiError } from '../meta/instagram'
import type { InstagramPublisher, PublishInput } from '../meta/publish'
import { asUser, createHarness, type Harness } from '../test/harness'
import { publishDuePosts, publishPost } from './run'

let h: Harness
let auraId: string
let chamadas: PublishInput[]
let falhar: string | null
let emSegundoPlano: Promise<unknown>[]

const metaFalsa: InstagramPublisher = async (input) => {
  chamadas.push(input)
  if (falhar) throw new InstagramApiError(falhar)
  return {
    mediaId: `ig-${chamadas.length}`,
    permalink: `https://instagram.com/p/${chamadas.length}`,
  }
}

beforeEach(async () => {
  process.env.FIRMUS_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  chamadas = []
  falhar = null
  emSegundoPlano = []
  h = await createHarness({
    publish: metaFalsa,
    runInBackground: (t) => void emSegundoPlano.push(t),
  })
  const aura = await h.createCompanyWithBoss({
    companyName: 'Studio Aura',
    userId: 'chefe-aura',
    email: 'chefe@aura.com',
    fullName: 'Chefe da Aura',
  })
  auraId = aura.companyId
  await h.db.insert(instagramConnections).values({
    companyId: auraId,
    igAccountId: '1784',
    username: 'studioaura',
    accessTokenCipher: encrypt('token-da-aura'),
  })
})

afterEach(async () => {
  await h.close()
})

/** Uma peça aprovada já na fila, com a hora informada. */
async function naFila(
  quando: Date | null,
  extra: Partial<typeof contentItems.$inferInsert> = {},
  status: 'rascunho' | 'agendado' = 'agendado',
) {
  const [peca] = await h.db
    .insert(contentItems)
    .values({
      companyId: auraId,
      type: 'carrossel',
      status: 'aprovado',
      title: 'Cinco mitos',
      caption: 'Legenda do post',
      body: {
        slides: [
          { title: 'Capa', imagePath: `${auraId}/conteudo/x/slide-01.png` },
          { title: 'Fim', imagePath: `${auraId}/conteudo/x/slide-02.png` },
        ],
      },
      ...extra,
    })
    .returning()
  const [post] = await h.db
    .insert(scheduledPosts)
    .values({
      companyId: auraId,
      contentItemId: peca!.id,
      scheduledFor: quando,
      status,
      collaborators: ['parceiro'],
    })
    .returning()
  return post!.id
}

const linha = async (id: string) =>
  (await h.db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id)))[0]!

describe('publicar uma postagem', () => {
  it('manda as artes, a legenda e os colaboradores e guarda o id e o link', async () => {
    const id = await naFila(new Date(Date.now() - 1000))

    await publishPost(h.publishing!, id)

    expect(chamadas).toHaveLength(1)
    expect(chamadas[0]).toMatchObject({
      token: 'token-da-aura',
      igAccountId: '1784',
      type: 'carrossel',
      caption: 'Legenda do post',
      collaborators: ['parceiro'],
      imageUrls: [
        `https://storage.test/${auraId}/conteudo/x/slide-01.png.jpg`,
        `https://storage.test/${auraId}/conteudo/x/slide-02.png.jpg`,
      ],
    })
    expect(await linha(id)).toMatchObject({
      status: 'publicado',
      externalId: 'ig-1',
      permalink: 'https://instagram.com/p/1',
      errorMessage: null,
    })
  })

  it('post único manda só a primeira arte', async () => {
    const id = await naFila(new Date(Date.now() - 1000), { type: 'post' })
    await publishPost(h.publishing!, id)
    expect(chamadas[0]!.imageUrls).toHaveLength(1)
  })

  it('não publica antes da hora nem o que não está agendado', async () => {
    const futuro = await naFila(new Date(Date.now() + 3_600_000))
    const rascunho = await naFila(null, {}, 'rascunho')

    await publishPost(h.publishing!, futuro)
    await publishPost(h.publishing!, rascunho)

    expect(chamadas).toHaveLength(0)
    expect((await linha(futuro)).status).toBe('agendado')
  })

  it('não publica duas vezes a mesma postagem', async () => {
    const id = await naFila(new Date(Date.now() - 1000))

    await Promise.all([publishPost(h.publishing!, id), publishPost(h.publishing!, id)])

    expect(chamadas).toHaveLength(1)
  })

  it('quando a Meta recusa, marca como falha com a mensagem', async () => {
    falhar = 'A Meta não deu permissão para publicar nesta conta.'
    const id = await naFila(new Date(Date.now() - 1000))

    await publishPost(h.publishing!, id)

    expect(await linha(id)).toMatchObject({
      status: 'falhou',
      errorMessage: 'A Meta não deu permissão para publicar nesta conta.',
    })
  })

  it('sem Instagram conectado, falha avisando', async () => {
    await h.db.delete(instagramConnections)
    const id = await naFila(new Date(Date.now() - 1000))

    await publishPost(h.publishing!, id)

    expect((await linha(id)).errorMessage).toMatch(/não está conectado/)
    expect(chamadas).toHaveLength(0)
  })
})

describe('checagem dos agendados', () => {
  it('publica só os que venceram', async () => {
    const vencida = await naFila(new Date(Date.now() - 60_000))
    const futura = await naFila(new Date(Date.now() + 3_600_000))

    const n = await publishDuePosts(h.publishing!)

    expect(n).toBe(1)
    expect((await linha(vencida)).status).toBe('publicado')
    expect((await linha(futura)).status).toBe('agendado')
  })

  it('solta a postagem travada em "publicando" como falha, sem republicar', async () => {
    const id = await naFila(new Date(Date.now() - 3_600_000))
    await h.db
      .update(scheduledPosts)
      .set({ status: 'publicando', updatedAt: new Date(Date.now() - 3_600_000) })
      .where(eq(scheduledPosts.id, id))

    await publishDuePosts(h.publishing!)

    expect((await linha(id)).status).toBe('falhou')
    expect(chamadas).toHaveLength(0)
  })
})

describe('pela api', () => {
  it('"postar agora" publica em seguida, e dá para tentar de novo depois de uma falha', async () => {
    falhar = 'Recusado.'
    const id = await naFila(null, {}, 'rascunho')
    const corpo = { acao: 'agora', collaborators: [], commentAutomation: false }

    const primeira = await request(h.app)
      .put(`/scheduled-posts/${id}`)
      .set(asUser('chefe-aura'))
      .send(corpo)
    expect(primeira.body.publishing).toBe(true)
    await Promise.all(emSegundoPlano)
    expect((await linha(id)).status).toBe('falhou')

    falhar = null
    const segunda = await request(h.app)
      .put(`/scheduled-posts/${id}`)
      .set(asUser('chefe-aura'))
      .send(corpo)
    expect(segunda.status).toBe(200)
    await Promise.all(emSegundoPlano)
    expect(await linha(id)).toMatchObject({ status: 'publicado', errorMessage: null })
  })

  it('a checagem de fora exige a senha CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'segredo-de-teste'
    await naFila(new Date(Date.now() - 1000))

    expect((await request(h.app).get('/cron/publicar')).status).toBe(401)
    const certa = await request(h.app)
      .get('/cron/publicar')
      .set('Authorization', 'Bearer segredo-de-teste')
    expect(certa.status).toBe(200)
    expect(certa.body.processadas).toBe(1)
    delete process.env.CRON_SECRET
  })
})
