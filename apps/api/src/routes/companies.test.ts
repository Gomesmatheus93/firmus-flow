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

describe('POST /companies', () => {
  it('cria a empresa e torna quem criou o chefe', async () => {
    h.addUser({ id: 'u1', email: 'matheus@exemplo.com', fullName: 'Matheus Gomes' })

    const response = await request(h.app)
      .post('/companies')
      .set(asUser('u1'))
      .send({ name: 'Studio Aura', segment: 'Estética' })

    expect(response.status).toBe(201)
    expect(response.body.company.name).toBe('Studio Aura')
    expect(response.body.company.role).toBe('chefe')

    const me = await request(h.app).get('/me').set(asUser('u1'))
    expect(me.body.company.role).toBe('chefe')
  })

  it('recusa nome curto demais', async () => {
    h.addUser({ id: 'u1', email: 'matheus@exemplo.com', fullName: 'Matheus Gomes' })

    const response = await request(h.app).post('/companies').set(asUser('u1')).send({ name: 'A' })

    expect(response.status).toBe(400)
  })

  it('não deixa criar uma segunda empresa', async () => {
    await h.createCompanyWithBoss({
      companyName: 'Studio Aura',
      userId: 'u1',
      email: 'matheus@exemplo.com',
      fullName: 'Matheus Gomes',
    })

    const response = await request(h.app)
      .post('/companies')
      .set(asUser('u1'))
      .send({ name: 'Outra Empresa' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('ja_tem_empresa')
  })
})
