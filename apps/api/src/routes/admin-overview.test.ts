import { agentRuns, invoices, plans, subscriptions } from '@firmus/db/schema'
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

const hoje = new Date()
const inicioDoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1))
const mesPassado = new Date(inicioDoMes.getTime() - 10 * 24 * 60 * 60 * 1000)
const diaIso = (d: Date) => d.toISOString().slice(0, 10)

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

  await h.addOperator({
    userId: 'operador',
    email: 'suporte@firmus.tech',
    fullName: 'Suporte Firmus',
  })

  const [mensal] = await h.db
    .insert(plans)
    .values({ name: 'Essencial', priceCents: 29900, interval: 'mensal' })
    .returning()

  const [anual] = await h.db
    .insert(plans)
    .values({ name: 'Anual', priceCents: 360000, interval: 'anual' })
    .returning()

  return { aura, rival, mensal: mensal!, anual: anual! }
}

const comoOperador = () => request(h.app).get('/admin/overview').set(asUser('operador'))

describe('acesso ao painel do negócio', () => {
  it('quem não é operador leva 403', async () => {
    await cenario()

    const resposta = await request(h.app).get('/admin/overview').set(asUser('chefe-aura'))

    expect(resposta.status).toBe(403)
    expect(resposta.body.error.code).toBe('sem_acesso_operador')
  })

  it('sem nenhum dado, devolve zeros em vez de quebrar', async () => {
    await cenario()

    const resposta = await comoOperador()

    expect(resposta.status).toBe(200)
    expect(resposta.body.clientes.total).toBe(2)
    expect(resposta.body.receita.mrrCents).toBe(0)
    expect(resposta.body.custoIa.noMesCents).toBe(0)
    expect(resposta.body.desistencias.noMes).toBe(0)
  })
})

describe('receita', () => {
  it('MRR soma só assinatura ativa, ignorando teste e cancelada', async () => {
    const { aura, rival, mensal } = await cenario()

    await h.db.insert(subscriptions).values([
      { companyId: aura.companyId, planId: mensal.id, status: 'ativa' },
      { companyId: rival.companyId, planId: mensal.id, status: 'teste' },
    ])

    const resposta = await comoOperador()

    expect(resposta.body.receita.mrrCents).toBe(29900)
  })

  it('plano anual entra dividido por doze', async () => {
    const { aura, anual } = await cenario()

    await h.db
      .insert(subscriptions)
      .values({ companyId: aura.companyId, planId: anual.id, status: 'ativa' })

    const resposta = await comoOperador()

    // 360000 / 12 = 30000. Sem a divisão, um cliente anual inflaria o mês.
    expect(resposta.body.receita.mrrCents).toBe(30000)
  })

  it('recebido no mês conta só fatura paga dentro do mês', async () => {
    const { aura } = await cenario()

    await h.db.insert(invoices).values([
      {
        companyId: aura.companyId,
        amountCents: 29900,
        status: 'paga',
        dueDate: diaIso(hoje),
        paidAt: hoje,
      },
      {
        companyId: aura.companyId,
        amountCents: 99900,
        status: 'paga',
        dueDate: diaIso(mesPassado),
        paidAt: mesPassado,
      },
      { companyId: aura.companyId, amountCents: 15000, status: 'aberta', dueDate: diaIso(hoje) },
    ])

    const resposta = await comoOperador()

    expect(resposta.body.receita.recebidoNoMesCents).toBe(29900)
    expect(resposta.body.receita.emAbertoCents).toBe(15000)
  })
})

describe('inadimplência', () => {
  it('conta empresa, não fatura', async () => {
    const { aura } = await cenario()

    // Duas faturas vencidas do mesmo cliente são um inadimplente, não dois.
    await h.db.insert(invoices).values([
      {
        companyId: aura.companyId,
        amountCents: 10000,
        status: 'vencida',
        dueDate: diaIso(mesPassado),
      },
      {
        companyId: aura.companyId,
        amountCents: 20000,
        status: 'vencida',
        dueDate: diaIso(mesPassado),
      },
    ])

    const resposta = await comoOperador()

    expect(resposta.body.inadimplencia.empresas).toBe(1)
    expect(resposta.body.inadimplencia.valorCents).toBe(30000)
  })
})

describe('desistências', () => {
  it('conta só os cancelamentos deste mês', async () => {
    const { aura, rival, mensal } = await cenario()

    await h.db.insert(subscriptions).values([
      {
        companyId: aura.companyId,
        planId: mensal.id,
        status: 'cancelada',
        startedAt: mesPassado,
        canceledAt: hoje,
        cancelReason: 'achou caro',
      },
      {
        companyId: rival.companyId,
        planId: mensal.id,
        status: 'cancelada',
        startedAt: mesPassado,
        canceledAt: mesPassado,
      },
    ])

    const resposta = await comoOperador()

    expect(resposta.body.desistencias.noMes).toBe(1)
  })
})

describe('custo de IA', () => {
  it('usa a cotação guardada em cada execução, não a de hoje', async () => {
    const { aura } = await cenario()

    await h.db.insert(agentRuns).values([
      {
        companyId: aura.companyId,
        agentName: 'conteudo',
        model: 'claude-opus-5',
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: '0.01000000',
        usdBrlRate: '5.0000',
      },
      {
        companyId: aura.companyId,
        agentName: 'auditoria',
        model: 'claude-opus-5',
        inputTokens: 2000,
        outputTokens: 800,
        costUsd: '0.02000000',
        usdBrlRate: '6.0000',
      },
    ])

    const resposta = await comoOperador()

    // 0,01 x 5 = R$ 0,05 e 0,02 x 6 = R$ 0,12. Soma: R$ 0,17 = 17 centavos.
    // Se usasse uma cotação só, o número estaria errado.
    expect(resposta.body.custoIa.noMesCents).toBe(17)
    expect(resposta.body.custoIa.tokens).toBe(4300)
    expect(resposta.body.custoIa.chamadas).toBe(2)
  })

  it('não perde centavo em muitas chamadas baratas', async () => {
    const { aura } = await cenario()

    // Cem chamadas de meio centavo cada. Arredondando uma a uma daria zero.
    await h.db.insert(agentRuns).values(
      Array.from({ length: 100 }, () => ({
        companyId: aura.companyId,
        agentName: 'atendimento',
        model: 'claude-haiku-4-5',
        costUsd: '0.00100000',
        usdBrlRate: '5.0000',
      })),
    )

    const resposta = await comoOperador()

    // 100 x 0,001 x 5 = R$ 0,50
    expect(resposta.body.custoIa.noMesCents).toBe(50)
  })

  it('mostra quem mais gastou', async () => {
    const { aura, rival } = await cenario()

    await h.db.insert(agentRuns).values([
      {
        companyId: aura.companyId,
        agentName: 'conteudo',
        model: 'claude-opus-5',
        costUsd: '1.00000000',
        usdBrlRate: '5.0000',
      },
      {
        companyId: rival.companyId,
        agentName: 'conteudo',
        model: 'claude-opus-5',
        costUsd: '3.00000000',
        usdBrlRate: '5.0000',
      },
    ])

    const resposta = await comoOperador()

    expect(resposta.body.custoIa.porEmpresa[0].companyName).toBe('Clínica Rival')
    expect(resposta.body.custoIa.porEmpresa[0].cents).toBe(1500)
  })
})

describe('margem', () => {
  it('é o que entrou menos o que a IA custou', async () => {
    const { aura } = await cenario()

    await h.db.insert(invoices).values({
      companyId: aura.companyId,
      amountCents: 29900,
      status: 'paga',
      dueDate: diaIso(hoje),
      paidAt: hoje,
    })

    await h.db.insert(agentRuns).values({
      companyId: aura.companyId,
      agentName: 'conteudo',
      model: 'claude-opus-5',
      costUsd: '10.00000000',
      usdBrlRate: '5.0000',
    })

    const resposta = await comoOperador()

    // R$ 299,00 recebidos menos R$ 50,00 de IA = R$ 249,00
    expect(resposta.body.margemCents).toBe(24900)
  })
})
