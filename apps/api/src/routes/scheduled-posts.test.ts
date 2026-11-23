import { contentItems, scheduledPosts } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AssetUrlSigner } from '../storage/supabase'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let rivalId: string

const sign: AssetUrlSigner = async (paths) => paths.map((p) => `https://storage.test/${p}`)

beforeEach(async () => {
  h = await createHarness({ signAssetUrls: sign })

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
})

afterEach(async () => {
  await h.close()
})

async function peca(
  companyId: string,
  extra: Partial<typeof contentItems.$inferInsert> = {},
): Promise<string> {
  const [item] = await h.db
    .insert(contentItems)
    .values({
      companyId,
      type: 'carrossel',
      status: 'aprovado',
      title: 'Cinco mitos',
      body: { slides: [{ title: 'Capa', imagePath: `${companyId}/conteudo/x/slide-01.png` }] },
      ...extra,
    })
    .returning()
  return item!.id
}

const enviar = (quem: string, contentItemId: string) =>
  request(h.app).post('/scheduled-posts').set(asUser(quem)).send({ contentItemId })

const daquiUmDia = () => new Date(Date.now() + 86_400_000).toISOString()

describe('enviar para postar', () => {
  it('põe a peça aprovada na fila, sem hora, e a lista mostra a capa', async () => {
    const id = await peca(auraId)

    const resposta = await enviar('chefe-aura', id)
    expect(resposta.status).toBe(201)

    const lista = await request(h.app).get('/scheduled-posts').set(asUser('chefe-aura'))
    expect(lista.body.posts).toHaveLength(1)
    expect(lista.body.posts[0]).toMatchObject({
      contentItemId: id,
      status: 'rascunho',
      scheduledFor: null,
      collaborators: [],
      commentAutomation: false,
      slideCount: 1,
      coverUrl: `https://storage.test/${auraId}/conteudo/x/slide-01.png`,
    })
  })

  it('não põe a mesma peça duas vezes na fila', async () => {
    const id = await peca(auraId)
    await enviar('chefe-aura', id)

    const segunda = await enviar('chefe-aura', id)
    expect(segunda.status).toBe(200)
    expect(segunda.body.alreadyQueued).toBe(true)

    const linhas = await h.db.select().from(scheduledPosts)
    expect(linhas).toHaveLength(1)
  })

  it('recusa peça que ainda não foi aprovada', async () => {
    const id = await peca(auraId, { status: 'aguardando' })

    const resposta = await enviar('chefe-aura', id)
    expect(resposta.status).toBe(409)
    expect(resposta.body.error.code).toBe('peca_nao_aprovada')
  })

  it('recusa roteiro de reel, que não tem arte', async () => {
    const id = await peca(auraId, { type: 'reel' })
    expect((await enviar('chefe-aura', id)).status).toBe(400)
  })

  it('só o chefe envia', async () => {
    const id = await peca(auraId)
    expect((await enviar('func-aura', id)).status).toBe(403)
  })

  it('peça de outra empresa é 404, e a fila de uma empresa não aparece na outra', async () => {
    const daRival = await peca(rivalId)
    expect((await enviar('chefe-aura', daRival)).status).toBe(404)

    await enviar('chefe-rival', daRival)
    const lista = await request(h.app).get('/scheduled-posts').set(asUser('chefe-aura'))
    expect(lista.body.posts).toEqual([])
  })
})

describe('agendar ou postar agora', () => {
  async function naFila(extra: Partial<typeof contentItems.$inferInsert> = {}) {
    const id = await peca(auraId, extra)
    await enviar('chefe-aura', id)
    const [post] = await h.db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.contentItemId, id))
    return post!.id
  }

  const publicar = (id: string, corpo: object, quem = 'chefe-aura') =>
    request(h.app).put(`/scheduled-posts/${id}`).set(asUser(quem)).send(corpo)

  it('agenda com colaboradores sem @ e a automação ligada', async () => {
    const id = await naFila()
    const quando = daquiUmDia()

    const resposta = await publicar(id, {
      acao: 'agendar',
      scheduledFor: quando,
      collaborators: ['@LaveSeque', 'parceiro.loja', '@laveseque'],
      commentAutomation: true,
    })

    expect(resposta.status).toBe(200)
    const [post] = await h.db.select().from(scheduledPosts)
    expect(post).toMatchObject({
      status: 'agendado',
      collaborators: ['laveseque', 'parceiro.loja'],
      commentAutomation: true,
    })
    expect(post!.scheduledFor!.toISOString()).toBe(quando)
  })

  it('postar agora marca a hora de agora', async () => {
    const id = await naFila()
    const antes = Date.now()

    const resposta = await publicar(id, {
      acao: 'agora',
      collaborators: [],
      commentAutomation: false,
    })

    expect(resposta.status).toBe(200)
    const [post] = await h.db.select().from(scheduledPosts)
    expect(post!.status).toBe('agendado')
    expect(post!.scheduledFor!.getTime()).toBeGreaterThanOrEqual(antes - 1000)
  })

  it('recusa data no passado e @ inválido', async () => {
    const id = await naFila()

    const passado = await publicar(id, {
      acao: 'agendar',
      scheduledFor: '2020-01-01T12:00:00.000Z',
      collaborators: [],
      commentAutomation: false,
    })
    expect(passado.status).toBe(400)

    const arroba = await publicar(id, {
      acao: 'agora',
      collaborators: ['nome com espaço'],
      commentAutomation: false,
    })
    expect(arroba.status).toBe(400)
  })

  it('story não guarda colaborador nem automação de comentários', async () => {
    const id = await naFila({ type: 'story' })

    await publicar(id, { acao: 'agora', collaborators: ['parceiro'], commentAutomation: true })

    const [post] = await h.db.select().from(scheduledPosts)
    expect(post).toMatchObject({ collaborators: [], commentAutomation: false })
  })

  it('postagem de outra empresa é 404, e o funcionário não agenda', async () => {
    const id = await naFila()
    const corpo = { acao: 'agora', collaborators: [], commentAutomation: false }

    expect((await publicar(id, corpo, 'chefe-rival')).status).toBe(404)
    expect((await publicar(id, corpo, 'func-aura')).status).toBe(403)
  })

  it('tira da fila sem apagar a peça', async () => {
    const id = await naFila()

    const resposta = await request(h.app).delete(`/scheduled-posts/${id}`).set(asUser('chefe-aura'))

    expect(resposta.status).toBe(204)
    expect(await h.db.select().from(scheduledPosts)).toEqual([])
    expect(await h.db.select().from(contentItems)).toHaveLength(1)
  })
})
