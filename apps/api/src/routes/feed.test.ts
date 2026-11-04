import {
  contentItems,
  instagramConnections,
  instagramMedia,
  scheduledPosts,
} from '@firmus/db/schema'
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
  title: string,
  extra: Partial<typeof contentItems.$inferInsert> = {},
) {
  const [item] = await h.db
    .insert(contentItems)
    .values({
      companyId,
      type: 'carrossel',
      status: 'aprovado',
      title,
      body: {
        slides: [{ title: 'Capa', imagePath: `${companyId}/conteudo/${title}/slide-01.png` }],
      },
      ...extra,
    })
    .returning()
  return item!.id
}

async function agendar(
  companyId: string,
  contentItemId: string,
  quando: string,
  status = 'agendado',
) {
  await h.db.insert(scheduledPosts).values({
    companyId,
    contentItemId,
    scheduledFor: new Date(quando),
    status: status as 'agendado',
  })
}

const feed = (quem: string) => request(h.app).get('/feed').set(asUser(quem))

describe('prévia do feed', () => {
  it('programadas em cima, da mais distante para a mais próxima; depois as aprovadas sem data', async () => {
    const proxima = await peca(auraId, 'proxima')
    const distante = await peca(auraId, 'distante')
    await peca(auraId, 'sem-data')
    await agendar(auraId, proxima, '2026-11-09T12:00:00Z')
    await agendar(auraId, distante, '2026-11-13T12:00:00Z')

    const resposta = await feed('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.upcoming.map((p: { title: string }) => p.title)).toEqual([
      'distante',
      'proxima',
      'sem-data',
    ])
    expect(resposta.body.upcoming[2].scheduledFor).toBeNull()
    expect(resposta.body.upcoming[0].images).toEqual([
      `https://storage.test/${auraId}/conteudo/distante/slide-01.png`,
    ])
  })

  it('aguardando e rejeitada ficam de fora; programada entra mesmo sem estar aprovada', async () => {
    await peca(auraId, 'aguardando', { status: 'aguardando' })
    await peca(auraId, 'rejeitada', { status: 'rejeitado' })
    const programada = await peca(auraId, 'programada', { status: 'aguardando' })
    await agendar(auraId, programada, '2026-11-10T12:00:00Z')

    const resposta = await feed('chefe-aura')

    expect(resposta.body.upcoming.map((p: { title: string }) => p.title)).toEqual(['programada'])
  })

  it('story, reel e peça já publicada não entram como próximas', async () => {
    await peca(auraId, 'story', { type: 'story' })
    await peca(auraId, 'reel', { type: 'reel' })
    const publicada = await peca(auraId, 'publicada')
    await agendar(auraId, publicada, '2026-11-01T12:00:00Z', 'publicado')

    const resposta = await feed('chefe-aura')

    expect(resposta.body.upcoming).toEqual([])
  })

  it('embaixo, os posts já publicados, do mais novo para o mais antigo', async () => {
    await h.db.insert(instagramMedia).values([
      {
        companyId: auraId,
        igMediaId: 'velho',
        mediaType: 'IMAGE',
        postedAt: new Date('2026-10-01'),
      },
      {
        companyId: auraId,
        igMediaId: 'novo',
        mediaType: 'IMAGE',
        postedAt: new Date('2026-10-20'),
      },
    ])

    const resposta = await feed('chefe-aura')

    expect(resposta.body.published.map((p: { id: string }) => p.id)).toEqual(['novo', 'velho'])
  })

  it('com Instagram conectado, devolve o perfil; sem, devolve null', async () => {
    await h.db.insert(instagramConnections).values({
      companyId: auraId,
      igAccountId: '1',
      username: 'studioaura',
      accessTokenCipher: 'x',
    })

    expect((await feed('chefe-aura')).body.profile.username).toBe('studioaura')
    expect((await feed('chefe-rival')).body.profile).toBeNull()
  })

  it('nada de outra empresa aparece', async () => {
    await peca(rivalId, 'da-rival')
    await h.db.insert(instagramMedia).values({
      companyId: rivalId,
      igMediaId: 'post-rival',
      mediaType: 'IMAGE',
      postedAt: new Date(),
    })

    const resposta = await feed('chefe-aura')

    expect(resposta.body.upcoming).toEqual([])
    expect(resposta.body.published).toEqual([])
  })
})
