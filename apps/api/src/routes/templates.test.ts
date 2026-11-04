import { companyTemplates } from '@firmus/db/schema'
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

  await h.createCompanyWithBoss({
    companyName: 'Clínica Rival',
    userId: 'chefe-rival',
    email: 'chefe@rival.com',
    fullName: 'Chefe da Rival',
  })
})

afterEach(async () => {
  await h.close()
})

const listar = (quem: string) => request(h.app).get('/templates').set(asUser(quem))

describe('modelos liberados', () => {
  it('devolve os modelos da empresa, na ordem do catálogo', async () => {
    await h.db.insert(companyTemplates).values([
      { companyId: auraId, templateKey: 'brutalista' },
      { companyId: auraId, templateKey: 'kit-carrossel' },
    ])

    const resposta = await listar('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.keys).toEqual(['kit-carrossel', 'brutalista'])
  })

  it('o funcionário também vê: ele cria conteúdo', async () => {
    await h.db.insert(companyTemplates).values({ companyId: auraId, templateKey: 'editorial' })

    const resposta = await listar('func-aura')

    expect(resposta.body.keys).toEqual(['editorial'])
  })

  it('modelo de uma empresa não aparece para a outra', async () => {
    await h.db.insert(companyTemplates).values({ companyId: auraId, templateKey: 'kit-carrossel' })

    const resposta = await listar('chefe-rival')

    expect(resposta.status).toBe(200)
    expect(resposta.body.keys).toEqual([])
  })

  it('chave que o código não conhece mais é ignorada', async () => {
    await h.db.insert(companyTemplates).values([
      { companyId: auraId, templateKey: 'modelo-aposentado' },
      { companyId: auraId, templateKey: 'editorial' },
    ])

    const resposta = await listar('chefe-aura')

    expect(resposta.body.keys).toEqual(['editorial'])
  })
})
