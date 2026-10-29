import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { asUser, createHarness, type Harness } from './test/harness'

let h: Harness

beforeEach(async () => {
  h = await createHarness()
})

afterEach(async () => {
  await h.close()
})

describe('GET /health', () => {
  it('responde 200 sem exigir login', async () => {
    const response = await request(h.app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ ok: true })
  })
})

describe('autenticação', () => {
  it('recusa requisição sem token', async () => {
    const response = await request(h.app).get('/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('nao_autenticado')
  })

  it('recusa token desconhecido', async () => {
    const response = await request(h.app).get('/me').set(asUser('token-inventado'))

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('sessao_invalida')
  })

  it('devolve company nulo para quem ainda não tem empresa', async () => {
    h.addUser({ id: 'u-sem-empresa', email: 'novo@exemplo.com', fullName: 'Novo Usuário' })

    const response = await request(h.app).get('/me').set(asUser('u-sem-empresa'))

    expect(response.status).toBe(200)
    expect(response.body.company).toBeNull()
    expect(response.body.user.email).toBe('novo@exemplo.com')
  })
})
