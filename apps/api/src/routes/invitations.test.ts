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

async function companyWithInvite(email = 'ana@aura.com') {
  await h.createCompanyWithBoss({
    companyName: 'Studio Aura',
    userId: 'chefe-aura',
    email: 'chefe@aura.com',
    fullName: 'Chefe da Aura',
  })

  const response = await request(h.app)
    .post('/team/invitations')
    .set(asUser('chefe-aura'))
    .send({ email })

  const token = String(response.body.inviteUrl).split('/').pop()!

  return { token, inviteUrl: response.body.inviteUrl as string }
}

describe('convite', () => {
  it('mostra a empresa sem exigir login, porque o convidado ainda não tem conta', async () => {
    const { token } = await companyWithInvite()

    const response = await request(h.app).get(`/invitations/${token}`)

    expect(response.status).toBe(200)
    expect(response.body.invitation.companyName).toBe('Studio Aura')
    expect(response.body.invitation.email).toBe('ana@aura.com')
    expect(response.body.invitation.role).toBe('funcionario')
  })

  it('token inválido não revela nada', async () => {
    await companyWithInvite()

    const response = await request(h.app).get('/invitations/token-chutado')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('convite_invalido')
  })

  it('aceitar o convite coloca a pessoa na empresa como funcionário', async () => {
    const { token } = await companyWithInvite()

    h.addUser({ id: 'ana', email: 'ana@aura.com', fullName: 'Ana Beatriz' })

    const response = await request(h.app).post(`/invitations/${token}/accept`).set(asUser('ana'))

    expect(response.status).toBe(200)
    expect(response.body.company.name).toBe('Studio Aura')
    expect(response.body.company.role).toBe('funcionario')

    const me = await request(h.app).get('/me').set(asUser('ana'))
    expect(me.body.company.role).toBe('funcionario')
  })

  it('outra pessoa com o link não entra na empresa', async () => {
    const { token } = await companyWithInvite()

    h.addUser({ id: 'intruso', email: 'intruso@qualquer.com', fullName: 'Intruso' })

    const response = await request(h.app)
      .post(`/invitations/${token}/accept`)
      .set(asUser('intruso'))

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('convite_de_outro_email')

    const me = await request(h.app).get('/me').set(asUser('intruso'))
    expect(me.body.company).toBeNull()
  })

  it('o mesmo convite não é aceito duas vezes', async () => {
    const { token } = await companyWithInvite()

    h.addUser({ id: 'ana', email: 'ana@aura.com', fullName: 'Ana Beatriz' })
    await request(h.app).post(`/invitations/${token}/accept`).set(asUser('ana'))

    const segunda = await request(h.app).post(`/invitations/${token}/accept`).set(asUser('ana'))

    expect(segunda.status).toBe(404)
    expect(segunda.body.error.code).toBe('convite_invalido')
  })

  it('convite cancelado deixa de funcionar', async () => {
    const { token } = await companyWithInvite()

    const equipe = await request(h.app).get('/team').set(asUser('chefe-aura'))
    const convite = equipe.body.pendingInvites[0]

    await request(h.app).delete(`/team/invitations/${convite.id}`).set(asUser('chefe-aura'))

    const response = await request(h.app).get(`/invitations/${token}`)
    expect(response.status).toBe(404)
  })
})
