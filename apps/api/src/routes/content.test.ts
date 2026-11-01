import { contentItems } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let rivalId: string
let peca: string

beforeEach(async () => {
  h = await createHarness()

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

  const [item] = await h.db
    .insert(contentItems)
    .values({
      companyId: auraId,
      type: 'carrossel',
      status: 'aguardando',
      title: 'Cinco mitos sobre limpeza de pele',
    })
    .returning()

  peca = item!.id
})

afterEach(async () => {
  await h.close()
})

const revisar = (quem: string, id: string, body: object) =>
  request(h.app).patch(`/content/${id}/status`).set(asUser(quem)).send(body)

const buscar = async (id: string) => {
  const [item] = await h.db.select().from(contentItems).where(eq(contentItems.id, id))
  return item!
}

describe('quem pode revisar', () => {
  it('o chefe aprova', async () => {
    const resposta = await revisar('chefe-aura', peca, { status: 'aprovado' })

    expect(resposta.status).toBe(200)
    expect((await buscar(peca)).status).toBe('aprovado')
  })

  it('o funcionário não aprova: aprovar é do chefe', async () => {
    const resposta = await revisar('func-aura', peca, { status: 'aprovado' })

    expect(resposta.status).toBe(403)
    expect((await buscar(peca)).status).toBe('aguardando')
  })

  it('e o funcionário continua vendo a lista de conteúdo', async () => {
    // O outro lado. Foi testar só o 403 que escondeu o bug em que o
    // funcionário levava 403 na plataforma inteira.
    const resposta = await request(h.app).get('/content').set(asUser('func-aura'))

    expect(resposta.status).toBe(200)
    expect(resposta.body.items).toHaveLength(1)
  })
})

describe('isolamento entre empresas', () => {
  it('o chefe de uma empresa não mexe na peça da outra', async () => {
    const [daRival] = await h.db
      .insert(contentItems)
      .values({ companyId: rivalId, type: 'post', status: 'aguardando', title: 'Post da Rival' })
      .returning()

    const resposta = await revisar('chefe-aura', daRival!.id, { status: 'aprovado' })

    // 404 e não 403: "existe, mas não é sua" já conta algo que não é dele.
    expect(resposta.status).toBe(404)
    expect((await buscar(daRival!.id)).status).toBe('aguardando')
  })
})

describe('pedido de ajuste', () => {
  it('guarda o recado', async () => {
    const resposta = await revisar('chefe-aura', peca, {
      status: 'ajustar',
      reviewNote: 'O gancho está fraco, começa pela dor.',
    })

    expect(resposta.status).toBe(200)

    const item = await buscar(peca)
    expect(item.status).toBe('ajustar')
    expect(item.reviewNote).toBe('O gancho está fraco, começa pela dor.')
  })

  it('sem recado é recusado', async () => {
    const resposta = await revisar('chefe-aura', peca, { status: 'ajustar' })

    expect(resposta.status).toBe(400)
    expect((await buscar(peca)).status).toBe('aguardando')
  })

  it('aprovar depois limpa o recado antigo', async () => {
    await revisar('chefe-aura', peca, { status: 'ajustar', reviewNote: 'faltou o CTA' })
    await revisar('chefe-aura', peca, { status: 'aprovado' })

    const item = await buscar(peca)
    expect(item.status).toBe('aprovado')
    // O recado era sobre o ajuste pedido antes; mantê-lo faria a peça aprovada
    // parecer que ainda tem pendência.
    expect(item.reviewNote).toBeNull()
  })
})

describe('rejeitar', () => {
  it('é uma situação própria, não um rascunho de volta', async () => {
    const resposta = await revisar('chefe-aura', peca, { status: 'rejeitado' })

    expect(resposta.status).toBe(200)
    expect((await buscar(peca)).status).toBe('rejeitado')
  })
})

describe('situação inválida', () => {
  it('não dá para mandar a peça de volta para aguardando', async () => {
    // 'aguardando' é para onde a peça vai sozinha ao ser criada, não decisão
    // de quem revisa.
    const resposta = await revisar('chefe-aura', peca, { status: 'aguardando' })

    expect(resposta.status).toBe(400)
  })

  it('status inventado é recusado', async () => {
    const resposta = await revisar('chefe-aura', peca, { status: 'maravilhoso' })

    expect(resposta.status).toBe(400)
  })
})
