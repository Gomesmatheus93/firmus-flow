import { contentItems, leads, planEntries } from '@firmus/db/schema'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

afterEach(async () => {
  await h.close()
})

/** Duas empresas, cada uma com conteúdo, plano e lead próprios. */
async function twoCompaniesWithData() {
  const aura = await h.createCompanyWithBoss({
    companyName: 'Studio Aura',
    userId: 'chefe-aura',
    email: 'chefe@aura.com',
    fullName: 'Chefe da Aura',
  })

  await h.addMember({
    companyId: aura.companyId,
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

  for (const [companyId, marca] of [
    [aura.companyId, 'Aura'],
    [rival.companyId, 'Rival'],
  ] as const) {
    await h.db
      .insert(contentItems)
      .values({ companyId, type: 'carrossel', title: `Carrossel da ${marca}` })
    await h.db
      .insert(planEntries)
      .values({ companyId, scheduledDate: '2026-11-03', format: 'reel', theme: `Tema da ${marca}` })
    await h.db.insert(leads).values({ companyId, name: `Lead da ${marca}` })
  }

  return { aura, rival }
}

describe('isolamento das telas da plataforma', () => {
  it('conteúdo de outra empresa não aparece', async () => {
    await twoCompaniesWithData()

    const aura = await request(h.app).get('/content').set(asUser('chefe-aura'))
    const rival = await request(h.app).get('/content').set(asUser('chefe-rival'))

    expect(aura.body.items.map((i: { title: string }) => i.title)).toEqual(['Carrossel da Aura'])
    expect(rival.body.items.map((i: { title: string }) => i.title)).toEqual(['Carrossel da Rival'])
  })

  it('planejamento de outra empresa não aparece', async () => {
    await twoCompaniesWithData()

    const response = await request(h.app).get('/plan').set(asUser('chefe-rival'))

    expect(response.body.entries).toHaveLength(1)
    expect(response.body.entries[0].theme).toBe('Tema da Rival')
  })

  it('leads de outra empresa não aparecem', async () => {
    await twoCompaniesWithData()

    const response = await request(h.app).get('/leads').set(asUser('chefe-aura'))

    expect(response.body.leads).toHaveLength(1)
    expect(response.body.leads[0].name).toBe('Lead da Aura')
  })

  it('telas sem dado devolvem lista vazia, não erro', async () => {
    await twoCompaniesWithData()

    for (const rota of ['/trends', '/scheduled-posts', '/metrics', '/conversations']) {
      const response = await request(h.app).get(rota).set(asUser('chefe-aura'))
      expect(response.status, rota).toBe(200)
    }
  })

  it('o filtro por status devolve só a fila de aprovação', async () => {
    const { aura } = await twoCompaniesWithData()

    await h.db.insert(contentItems).values({
      companyId: aura.companyId,
      type: 'post',
      title: 'Esperando o chefe',
      status: 'aguardando',
    })

    const response = await request(h.app)
      .get('/content?status=aguardando')
      .set(asUser('chefe-aura'))

    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].title).toBe('Esperando o chefe')
  })
})

describe('automação de comentários', () => {
  it('o chefe cria uma regra e ela aparece na listagem', async () => {
    await twoCompaniesWithData()

    const criada = await request(h.app)
      .post('/comment-rules')
      .set(asUser('chefe-aura'))
      .send({
        name: 'Pedido de preço',
        triggerType: 'palavra',
        keywords: ['preço', 'valor'],
        replyTemplate: 'Oi! Te chamei no direct com os valores.',
      })

    expect(criada.status).toBe(201)

    const lista = await request(h.app).get('/comment-rules').set(asUser('chefe-aura'))
    expect(lista.body.rules).toHaveLength(1)
    expect(lista.body.rules[0].keywords).toEqual(['preço', 'valor'])
  })

  it('funcionário não cria regra', async () => {
    await twoCompaniesWithData()

    const response = await request(h.app).post('/comment-rules').set(asUser('func-aura')).send({
      name: 'Qualquer',
      triggerType: 'qualquer',
      keywords: [],
      replyTemplate: 'Oi!',
    })

    expect(response.status).toBe(403)
  })

  it('gatilho por palavra sem palavra nenhuma é recusado', async () => {
    await twoCompaniesWithData()

    const response = await request(h.app)
      .post('/comment-rules')
      .set(asUser('chefe-aura'))
      .send({ name: 'Sem palavra', triggerType: 'palavra', keywords: [], replyTemplate: 'Oi!' })

    expect(response.status).toBe(400)
  })

  it('não desliga nem apaga regra de outra empresa', async () => {
    await twoCompaniesWithData()

    const criada = await request(h.app).post('/comment-rules').set(asUser('chefe-aura')).send({
      name: 'Da Aura',
      triggerType: 'qualquer',
      keywords: [],
      replyTemplate: 'Oi!',
    })

    const id = criada.body.rule.id

    const desligar = await request(h.app)
      .patch(`/comment-rules/${id}`)
      .set(asUser('chefe-rival'))
      .send({ active: false })
    expect(desligar.status).toBe(404)

    const apagar = await request(h.app).delete(`/comment-rules/${id}`).set(asUser('chefe-rival'))
    expect(apagar.status).toBe(404)

    const lista = await request(h.app).get('/comment-rules').set(asUser('chefe-aura'))
    expect(lista.body.rules).toHaveLength(1)
    expect(lista.body.rules[0].active).toBe(true)
  })
})

describe('o funcionario enxerga a plataforma', () => {
  /**
   * Regressao: o requireRole('chefe') da Equipe estava montado sem caminho.
   * Como aquele roteador entra antes dos outros, o funcionario levava 403 em
   * TODAS as telas, nao so na Equipe.
   */
  it('funcionario acessa as telas que nao sao de chefe', async () => {
    await twoCompaniesWithData()

    for (const rota of ['/me', '/brand', '/content', '/plan', '/leads', '/conversations']) {
      const response = await request(h.app).get(rota).set(asUser('func-aura'))
      expect(response.status, `funcionario em ${rota}`).toBe(200)
    }
  })

  it('e continua barrado so onde deve', async () => {
    await twoCompaniesWithData()

    const response = await request(h.app).get('/team').set(asUser('func-aura'))
    expect(response.status).toBe(403)
  })
})
