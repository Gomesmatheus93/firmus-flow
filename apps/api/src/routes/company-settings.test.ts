import { companies, users } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string

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

  await h.addOperator({
    userId: 'operador',
    email: 'suporte@firmus.tech',
    fullName: 'Suporte Firmus',
  })
})

afterEach(async () => {
  await h.close()
})

const empresa = async () => {
  const [c] = await h.db.select().from(companies).where(eq(companies.id, auraId))
  return c!
}

const salvar = (quem: string, body: object, cabecalhos: Record<string, string> = {}) =>
  request(h.app).patch('/company').set(asUser(quem)).set(cabecalhos).send(body)

describe('dados da empresa', () => {
  it('o chefe salva nome, segmento e Instagram', async () => {
    const resposta = await salvar('chefe-aura', {
      name: 'Studio Aura Estética',
      segment: 'Estética avançada',
      instagramHandle: '@studioaura',
    })

    expect(resposta.status).toBe(200)

    const c = await empresa()
    expect(c.name).toBe('Studio Aura Estética')
    expect(c.segment).toBe('Estética avançada')
    // Guardado sem arroba: ela é enfeite de exibição, não parte do nome.
    expect(c.instagramHandle).toBe('studioaura')
  })

  it('campo apagado vira nulo, não string vazia', async () => {
    await salvar('chefe-aura', { name: 'Studio Aura', segment: 'Estética' })
    await salvar('chefe-aura', { name: 'Studio Aura', segment: '' })

    expect((await empresa()).segment).toBeNull()
  })

  it('nome vazio é recusado', async () => {
    const resposta = await salvar('chefe-aura', { name: ' ' })

    expect(resposta.status).toBe(400)
    expect((await empresa()).name).toBe('Studio Aura')
  })

  it('o funcionário não edita a empresa', async () => {
    const resposta = await salvar('func-aura', { name: 'Nome Trocado' })

    expect(resposta.status).toBe(403)
    expect((await empresa()).name).toBe('Studio Aura')
  })

  it('o operador da Firmus também não: suporte lê, não renomeia', async () => {
    const resposta = await salvar('operador', { name: 'Nome Trocado' }, { 'x-firmus-company': auraId })

    expect(resposta.status).toBe(403)
    expect((await empresa()).name).toBe('Studio Aura')
  })
})

describe('meu perfil', () => {
  it('o usuário troca o próprio nome', async () => {
    const resposta = await request(h.app)
      .patch('/me')
      .set(asUser('func-aura'))
      .send({ fullName: 'Ana Paula Souza' })

    expect(resposta.status).toBe(200)

    const [u] = await h.db.select().from(users).where(eq(users.email, 'func@aura.com'))
    expect(u!.fullName).toBe('Ana Paula Souza')
  })

  it('nome vazio é recusado', async () => {
    const resposta = await request(h.app).patch('/me').set(asUser('func-aura')).send({ fullName: '' })

    expect(resposta.status).toBe(400)
  })
})
