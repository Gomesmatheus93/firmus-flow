import { contentItems, planEntries } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AssetRemover } from '../storage/supabase'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let rivalId: string
let apagados: string[][]

beforeEach(async () => {
  apagados = []
  const removeAssets: AssetRemover = async (paths) => {
    apagados.push(paths)
  }
  h = await createHarness({ removeAssets })

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

async function peca(companyId: string, status: 'aguardando' | 'aprovado' = 'aguardando') {
  const [item] = await h.db
    .insert(contentItems)
    .values({
      companyId,
      type: 'carrossel',
      status,
      title: 'Cinco mitos',
      body: {
        template: 'kit-carrossel',
        slides: [
          { title: 'Capa', imagePath: `${companyId}/conteudo/x/slide-01.png` },
          { title: 'Fora da pasta', imagePath: `outra-empresa/slide-02.png` },
          { title: 'Sem imagem' },
        ],
      },
    })
    .returning()
  return item!.id
}

const excluir = (quem: string, id: string) =>
  request(h.app).delete(`/content/${id}`).set(asUser(quem))

const existe = async (id: string) =>
  (await h.db.select().from(contentItems).where(eq(contentItems.id, id))).length > 0

describe('excluir peça', () => {
  it('o chefe exclui, e as imagens da pasta da empresa vão junto', async () => {
    const id = await peca(auraId)

    const resposta = await excluir('chefe-aura', id)

    expect(resposta.status).toBe(204)
    expect(await existe(id)).toBe(false)
    // Só o caminho dentro da pasta da empresa; o de fora nunca é tocado.
    expect(apagados).toEqual([[`${auraId}/conteudo/x/slide-01.png`]])
  })

  it('o funcionário também exclui (decisão do Matheus)', async () => {
    const id = await peca(auraId)

    expect((await excluir('func-aura', id)).status).toBe(204)
    expect(await existe(id)).toBe(false)
  })

  it('peça aprovada também pode ser excluída', async () => {
    const id = await peca(auraId, 'aprovado')

    expect((await excluir('chefe-aura', id)).status).toBe(204)
  })

  it('peça de outra empresa devolve 404 e continua lá', async () => {
    const id = await peca(rivalId)

    const resposta = await excluir('chefe-aura', id)

    expect(resposta.status).toBe(404)
    expect(await existe(id)).toBe(true)
    expect(apagados).toEqual([])
  })

  it('id que não é uuid devolve 404, sem erro de banco', async () => {
    expect((await excluir('chefe-aura', 'banana')).status).toBe(404)
  })

  it('a pauta do planejamento fica, só perde a ligação', async () => {
    const id = await peca(auraId)
    const [pauta] = await h.db
      .insert(planEntries)
      .values({
        companyId: auraId,
        scheduledDate: '2026-11-09',
        format: 'carrossel',
        theme: 'Quem somos',
        contentItemId: id,
      })
      .returning()

    await excluir('chefe-aura', id)

    const [depois] = await h.db.select().from(planEntries).where(eq(planEntries.id, pauta!.id))
    expect(depois).toBeDefined()
    expect(depois!.contentItemId).toBeNull()
  })
})

describe('modelo da peça', () => {
  it('a listagem diz qual modelo a peça usou', async () => {
    await peca(auraId)

    const resposta = await request(h.app).get('/content').set(asUser('chefe-aura'))

    expect(resposta.body.items[0].template).toBe('kit-carrossel')
  })
})
