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

/** Duas empresas, cada uma com seu chefe e seu funcionário. */
async function twoCompanies() {
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

  return { aura, rival }
}

describe('isolamento entre empresas', () => {
  it('cada chefe vê apenas a própria equipe', async () => {
    await twoCompanies()

    const aura = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const rival = await request(h.app).get('/team').set(asUser('chefe-rival'))

    expect(aura.status).toBe(200)
    expect(rival.status).toBe(200)

    const auraEmails = aura.body.members.map((m: { email: string }) => m.email).sort()
    const rivalEmails = rival.body.members.map((m: { email: string }) => m.email)

    expect(auraEmails).toEqual(['chefe@aura.com', 'func@aura.com'])
    expect(rivalEmails).toEqual(['chefe@rival.com'])
  })

  it('não remove membro de outra empresa, mesmo sabendo o id', async () => {
    await twoCompanies()

    // O chefe da Rival descobre o id do vínculo de alguém da Aura e tenta usar.
    const aura = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const alvo = aura.body.members.find((m: { email: string }) => m.email === 'func@aura.com')

    const response = await request(h.app)
      .delete(`/team/members/${alvo.membershipId}`)
      .set(asUser('chefe-rival'))

    expect(response.status).toBe(404)

    // A vítima continua na equipe.
    const depois = await request(h.app).get('/team').set(asUser('chefe-aura'))
    expect(depois.body.members).toHaveLength(2)
  })

  it('não cancela convite de outra empresa', async () => {
    await twoCompanies()

    await request(h.app)
      .post('/team/invitations')
      .set(asUser('chefe-aura'))
      .send({ email: 'nova@aura.com' })

    const aura = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const convite = aura.body.pendingInvites[0]

    const response = await request(h.app)
      .delete(`/team/invitations/${convite.id}`)
      .set(asUser('chefe-rival'))

    expect(response.status).toBe(404)
  })
})

describe('permissões por papel', () => {
  it('funcionário não vê a equipe', async () => {
    await twoCompanies()

    const response = await request(h.app).get('/team').set(asUser('func-aura'))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('papel_insuficiente')
  })

  it('funcionário não convida ninguém', async () => {
    await twoCompanies()

    const response = await request(h.app)
      .post('/team/invitations')
      .set(asUser('func-aura'))
      .send({ email: 'alguem@aura.com' })

    expect(response.status).toBe(403)
  })

  it('quem não tem empresa recebe 403 com instrução', async () => {
    h.addUser({ id: 'solto', email: 'solto@exemplo.com', fullName: 'Sem Empresa' })

    const response = await request(h.app).get('/team').set(asUser('solto'))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('sem_empresa')
  })
})

describe('gestão da equipe', () => {
  it('o chefe não remove a si mesmo', async () => {
    await twoCompanies()

    const aura = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const eu = aura.body.members.find((m: { email: string }) => m.email === 'chefe@aura.com')

    const response = await request(h.app)
      .delete(`/team/members/${eu.membershipId}`)
      .set(asUser('chefe-aura'))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('nao_remove_a_si')
  })

  it('o chefe remove um funcionário', async () => {
    await twoCompanies()

    const aura = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const alvo = aura.body.members.find((m: { email: string }) => m.email === 'func@aura.com')

    const response = await request(h.app)
      .delete(`/team/members/${alvo.membershipId}`)
      .set(asUser('chefe-aura'))

    expect(response.status).toBe(204)

    const depois = await request(h.app).get('/team').set(asUser('chefe-aura'))
    expect(depois.body.members).toHaveLength(1)
  })

  it('não convida quem já está na equipe', async () => {
    await twoCompanies()

    const response = await request(h.app)
      .post('/team/invitations')
      .set(asUser('chefe-aura'))
      .send({ email: 'func@aura.com' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('ja_e_membro')
  })
})
