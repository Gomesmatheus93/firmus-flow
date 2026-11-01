import { contentItems, operatorAccess } from '@firmus/db/schema'
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

/** Duas empresas com conteúdo, mais um operador da Firmus sem empresa nenhuma. */
async function cenario() {
  const aura = await h.createCompanyWithBoss({
    companyName: 'Studio Aura',
    userId: 'chefe-aura',
    email: 'chefe@aura.com',
    fullName: 'Chefe da Aura',
  })

  const rival = await h.createCompanyWithBoss({
    companyName: 'Clínica Rival',
    userId: 'chefe-rival',
    email: 'chefe@rival.com',
    fullName: 'Chefe da Rival',
  })

  await h.db
    .insert(contentItems)
    .values({ companyId: aura.companyId, type: 'carrossel', title: 'Segredo da Aura' })
  await h.db
    .insert(contentItems)
    .values({ companyId: rival.companyId, type: 'post', title: 'Segredo da Rival' })

  const operador = await h.addOperator({
    userId: 'operador',
    email: 'suporte@firmus.tech',
    fullName: 'Suporte Firmus',
  })

  return { aura, rival, operador }
}

const comoOperador = (companyId: string) => ({ 'X-Firmus-Company': companyId })

describe('quem não é operador não vira operador pelo cabeçalho', () => {
  /**
   * O teste mais importante do arquivo. Se este quebrar, qualquer cliente
   * consegue ler os dados de qualquer outro só mandando um cabeçalho.
   */
  it('chefe de uma empresa que manda o cabeçalho continua vendo a própria', async () => {
    const { rival } = await cenario()

    const resposta = await request(h.app)
      .get('/content')
      .set(asUser('chefe-aura'))
      .set(comoOperador(rival.companyId))

    expect(resposta.status).toBe(200)
    expect(resposta.body.items.map((i: { title: string }) => i.title)).toEqual(['Segredo da Aura'])
  })

  it('e o acesso dele não é registrado como se fosse de operador', async () => {
    const { rival } = await cenario()

    await request(h.app)
      .get('/content')
      .set(asUser('chefe-aura'))
      .set(comoOperador(rival.companyId))

    const registros = await h.db.select().from(operatorAccess)
    expect(registros).toHaveLength(0)
  })

  it('não-operador leva 403 na área de administração', async () => {
    await cenario()

    const resposta = await request(h.app).get('/admin/companies').set(asUser('chefe-aura'))

    expect(resposta.status).toBe(403)
    expect(resposta.body.error.code).toBe('sem_acesso_operador')
  })
})

describe('o operador da Firmus', () => {
  it('vê a lista de todas as empresas, com números e não conteúdo', async () => {
    await cenario()

    const resposta = await request(h.app).get('/admin/companies').set(asUser('operador'))

    expect(resposta.status).toBe(200)
    expect(resposta.body.companies.map((c: { name: string }) => c.name)).toEqual([
      'Clínica Rival',
      'Studio Aura',
    ])

    const aura = resposta.body.companies.find((c: { name: string }) => c.name === 'Studio Aura')
    expect(aura.members).toBe(1)
    expect(aura.contentCount).toBe(1)
    expect(JSON.stringify(resposta.body)).not.toContain('Segredo')
  })

  it('sem escolher empresa, não vê tela nenhuma', async () => {
    await cenario()

    const resposta = await request(h.app).get('/content').set(asUser('operador'))

    expect(resposta.status).toBe(403)
    expect(resposta.body.error.code).toBe('sem_empresa')
  })

  it('escolhendo uma empresa, vê os dados dela e só dela', async () => {
    const { rival } = await cenario()

    const resposta = await request(h.app)
      .get('/content')
      .set(asUser('operador'))
      .set(comoOperador(rival.companyId))

    expect(resposta.status).toBe(200)
    expect(resposta.body.items.map((i: { title: string }) => i.title)).toEqual(['Segredo da Rival'])
  })

  it('cada entrada numa empresa fica registrada', async () => {
    const { aura, operador } = await cenario()

    await request(h.app).get('/content').set(asUser('operador')).set(comoOperador(aura.companyId))

    const registros = await h.db.select().from(operatorAccess)
    expect(registros).toHaveLength(1)
    expect(registros[0]?.companyId).toBe(aura.companyId)
    expect(registros[0]?.operatorUserId).toBe(operador.userId)
    expect(registros[0]?.route).toBe('/content')
  })

  it('é barrado em conversas e leads, que têm dado pessoal de terceiros', async () => {
    const { aura } = await cenario()

    for (const rota of ['/conversations', '/leads']) {
      const resposta = await request(h.app)
        .get(rota)
        .set(asUser('operador'))
        .set(comoOperador(aura.companyId))

      expect(resposta.status, rota).toBe(403)
      expect(resposta.body.error.code, rota).toBe('bloqueado_para_operador')
    }
  })

  it('mas o dono da empresa continua vendo as próprias conversas e leads', async () => {
    await cenario()

    for (const rota of ['/conversations', '/leads']) {
      const resposta = await request(h.app).get(rota).set(asUser('chefe-aura'))
      expect(resposta.status, rota).toBe(200)
    }
  })

  it('empresa inexistente cai no caminho normal, não dá acesso', async () => {
    await cenario()

    const resposta = await request(h.app)
      .get('/content')
      .set(asUser('operador'))
      .set(comoOperador('00000000-0000-4000-8000-000000000000'))

    expect(resposta.status).toBe(403)
    expect(resposta.body.error.code).toBe('sem_empresa')
  })
})
