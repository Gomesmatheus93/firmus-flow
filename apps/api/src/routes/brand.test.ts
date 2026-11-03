import type { ModelClient } from '@firmus/agents/runtime'
import { brandBrains, instagramConnections, instagramMedia } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness

/** O que o agente `marca` devolveria, no formato que o schema exige. */
const rascunho = {
  context: 'Estúdio de estética em Mossoró, atende por agendamento.',
  services: ['limpeza de pele', 'microagulhamento'],
  audience: 'mulheres de 25 a 45 anos de Mossoró',
  differentiators: ['protocolo fechado de 4 sessões'],
  toneOfVoice: {
    summary: 'Direto e acolhedor, sem promessa de milagre.',
    dos: ['tratar o cliente por você'],
    donts: ['prometer cura'],
  },
  faq: [{ question: 'Dói?', answer: 'Usamos anestésico tópico.' }],
  missing: ['Quantos anos de mercado?'],
}

/** Cliente da Anthropic falso: responde o rascunho acima, sem tocar na rede. */
function iaFalsa(parsed: unknown = rascunho) {
  return {
    messages: {
      parse: async () => ({
        parsed_output: parsed,
        stop_reason: 'end_turn',
        stop_details: null,
        usage: { input_tokens: 1200, output_tokens: 600 },
      }),
    },
  } as unknown as ModelClient
}

const descricao =
  'Tenho um estúdio de estética em Mossoró. Faço limpeza de pele e microagulhamento, ' +
  'atendo só com horário marcado e o protocolo é de quatro sessões.'

async function cenario(aiClient: ModelClient | null = iaFalsa()) {
  h = await createHarness({ aiClient })

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

  return aura
}

afterEach(async () => {
  await h.close()
})

const montar = (quem: string, body: object = { description: descricao }) =>
  request(h.app).post('/brand/brain').set(asUser(quem)).send(body)

describe('quem pode montar o Cérebro', () => {
  it('o chefe pode', async () => {
    await cenario()

    const resposta = await montar('chefe-aura')

    expect(resposta.status).toBe(200)
  })

  it('o funcionário não pode: configurar a marca é do chefe', async () => {
    await cenario()

    const resposta = await montar('func-aura')

    expect(resposta.status).toBe(403)
  })

  it('e o funcionário continua lendo o Cérebro normalmente', async () => {
    // O outro lado da permissão. Testar só o 403 foi o que escondeu o bug em
    // que o funcionário levava 403 na plataforma inteira.
    await cenario()

    const resposta = await request(h.app).get('/brand').set(asUser('func-aura'))

    expect(resposta.status).toBe(200)
  })
})

describe('montagem do Cérebro', () => {
  it('salva o que o agente montou e devolve o que ainda falta', async () => {
    const aura = await cenario()

    const resposta = await montar('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.missing).toContain('Quantos anos de mercado?')

    const [brain] = await h.db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, aura.companyId))

    expect(brain!.audience).toBe('mulheres de 25 a 45 anos de Mossoró')
    expect(brain!.services).toEqual(['limpeza de pele', 'microagulhamento'])
    expect(brain!.toneOfVoice!.donts).toContain('prometer cura')
  })

  it('montar de novo atualiza o mesmo Cérebro, não cria um segundo', async () => {
    const aura = await cenario()

    await montar('chefe-aura')
    await montar('chefe-aura')

    const linhas = await h.db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, aura.companyId))

    expect(linhas).toHaveLength(1)
  })

  it('não apaga a paleta nem o logo, que vêm do formulário do chefe', async () => {
    const aura = await cenario()

    await h.db
      .insert(brandBrains)
      .values({
        companyId: aura.companyId,
        colorPalette: ['#1C8CFF', '#22C3E6'],
        logoUrl: 'https://exemplo.test/logo.png',
      })
      .onConflictDoNothing()

    await montar('chefe-aura')

    const [brain] = await h.db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, aura.companyId))

    // A IA não escolhe cor nem logo; o agente não deve zerar o que o chefe deu.
    expect(brain!.colorPalette).toEqual(['#1C8CFF', '#22C3E6'])
    expect(brain!.logoUrl).toBe('https://exemplo.test/logo.png')
    // E o que o agente monta entrou.
    expect(brain!.audience).toBe('mulheres de 25 a 45 anos de Mossoró')
  })

  it('descrição curta demais volta 400 sem chamar a IA', async () => {
    await cenario()

    const resposta = await montar('chefe-aura', { description: 'faço unha' })

    expect(resposta.status).toBe(400)
  })
})

describe('sem IA configurada', () => {
  it('devolve 503 dizendo o que falta no .env', async () => {
    h = await createHarness({ aiClient: null })

    await h.createCompanyWithBoss({
      companyName: 'Studio Aura',
      userId: 'chefe-aura',
      email: 'chefe@aura.com',
      fullName: 'Chefe da Aura',
    })

    const resposta = await montar('chefe-aura')

    expect(resposta.status).toBe(503)
    expect(resposta.body.error.code).toBe('ia_nao_configurada')
    expect(resposta.body.error.message).toContain('ANTHROPIC_API_KEY')
  })
})

/** O que o agente `auditoria` devolveria. */
const rascunhoAuditoria = {
  areas: [
    { label: 'Bio', score: 3 },
    { label: 'Link', score: 8 },
  ],
  strengths: [],
  issues: [{ priority: 'alta', title: 'A bio não diz para quem é', detail: 'Pela bio atual.' }],
  notEvaluated: ['Destaques: a API da Meta não mostra.'],
}

async function conectarInstagram(companyId: string) {
  await h.db.insert(instagramConnections).values({
    companyId,
    igAccountId: '1789',
    username: 'studioaura',
    accessTokenCipher: 'cifrado',
  })

  await h.db.insert(instagramMedia).values({
    companyId,
    igMediaId: 'post-1',
    caption: 'Limpeza de pele',
    mediaType: 'IMAGE',
    postedAt: new Date('2026-10-28T15:00:00Z'),
    reach: 200,
  })
}

const auditar = (quem: string) => request(h.app).post('/brand/audit').set(asUser(quem))

describe('auditoria', () => {
  it('o funcionário pode rodar', async () => {
    const aura = await cenario(iaFalsa(rascunhoAuditoria))
    await conectarInstagram(aura.companyId)

    const resposta = await auditar('func-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.brain.auditFindings.overallScore).toBe(5.5)
  })

  it('sem Instagram conectado devolve 409 dizendo o que fazer', async () => {
    await cenario(iaFalsa(rascunhoAuditoria))

    const resposta = await auditar('chefe-aura')

    expect(resposta.status).toBe(409)
    expect(resposta.body.error.code).toBe('sem_instagram')
    expect(resposta.body.error.message).toContain('Conecte o Instagram')
  })

  it('guarda a auditoria sem apagar o resto do Cérebro', async () => {
    const aura = await cenario(iaFalsa(rascunhoAuditoria))
    await conectarInstagram(aura.companyId)
    await h.db.insert(brandBrains).values({
      companyId: aura.companyId,
      audience: 'mulheres de 25 a 45 anos de Mossoró',
      colorPalette: ['#1C8CFF'],
    })

    await auditar('chefe-aura')

    const [brain] = await h.db
      .select()
      .from(brandBrains)
      .where(eq(brandBrains.companyId, aura.companyId))

    expect(brain!.auditFindings!.notEvaluated).toContain('Destaques: a API da Meta não mostra.')
    expect(brain!.audience).toBe('mulheres de 25 a 45 anos de Mossoró')
    expect(brain!.colorPalette).toEqual(['#1C8CFF'])
  })

  it('sem IA configurada devolve 503', async () => {
    const aura = await cenario(null)
    await conectarInstagram(aura.companyId)

    const resposta = await auditar('chefe-aura')

    expect(resposta.status).toBe(503)
    expect(resposta.body.error.code).toBe('ia_nao_configurada')
  })
})
