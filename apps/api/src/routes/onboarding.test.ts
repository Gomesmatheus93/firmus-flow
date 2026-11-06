import type { ModelClient } from '@firmus/agents/runtime'
import { brandBrains, brandOnboardings } from '@firmus/db/schema'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import type { AssetUploader } from '../storage/supabase'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness
let auraId: string
let enviados: { path: string; tipo: string; tamanho: number }[]

/** O que o agente `marca` devolveria. */
const rascunho = {
  context: 'Clínica odontológica em Mossoró.',
  services: ['implante', 'lentes de porcelana'],
  audience: 'mulheres de 25 a 45 anos',
  differentiators: ['parcelamento em 12x'],
  toneOfVoice: { summary: 'Acolhedora e segura.', dos: ['tratar por você'], donts: ['barato'] },
  faq: [{ question: 'Dói?', answer: 'Usamos anestesia.' }],
  missing: [],
}

function iaFalsa(): ModelClient {
  return {
    messages: {
      parse: async () => ({
        parsed_output: rascunho,
        stop_reason: 'end_turn',
        stop_details: null,
        usage: { input_tokens: 100, output_tokens: 100 },
      }),
    },
  } as unknown as ModelClient
}

async function cenario(aiClient: ModelClient | null = iaFalsa()) {
  enviados = []
  const uploadAsset: AssetUploader = async (path, body, tipo) => {
    enviados.push({ path, tipo, tamanho: body.length })
  }
  h = await createHarness({ aiClient, uploadAsset })

  const aura = await h.createCompanyWithBoss({
    companyName: 'Clínica Aura',
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
}

afterEach(async () => {
  await h.close()
})

const RESPOSTAS = [
  'Clínica odontológica. Quero vender mais implante.',
  'Mulheres de 25 a 45 anos com vergonha de sorrir.',
  'Atendimento sem pressa e parcelamento em 12x.',
  'Acolhedora, segura, moderna. Nunca diria barato.',
]

const estado = (quem = 'chefe-aura') => request(h.app).get('/onboarding').set(asUser(quem))
const responder = (passo: number, answer: string, quem = 'chefe-aura') =>
  request(h.app).put(`/onboarding/passo/${passo}`).set(asUser(quem)).send({ answer })

async function responderTudo() {
  for (const [i, r] of RESPOSTAS.entries()) await responder(i + 1, r)
}

/** Espera a análise em segundo plano terminar. */
async function esperarAnalise() {
  for (let i = 0; i < 50; i++) {
    const { body } = await estado()
    if (body.onboarding.status !== 'gerando') return body
    await new Promise((r) => setTimeout(r, 20))
  }
  throw new Error('a análise não terminou')
}

describe('fluxo de passos', () => {
  it('começa no passo 1, com o Cérebro incompleto', async () => {
    await cenario()

    const { body } = await estado()

    expect(body.brainComplete).toBe(false)
    expect(body.onboarding).toMatchObject({ currentStep: 1, answers: {}, status: 'respondendo' })
  })

  it('cada resposta salva o progresso: fechar a página e voltar continua de onde parou', async () => {
    await cenario()

    await responder(1, RESPOSTAS[0]!)
    await responder(2, RESPOSTAS[1]!)
    const { body } = await estado()

    expect(body.onboarding.currentStep).toBe(3)
    expect(body.onboarding.answers).toEqual({ oferta: RESPOSTAS[0], cliente: RESPOSTAS[1] })
  })

  it('não pula passo: o 3 antes do 2 é recusado', async () => {
    await cenario()
    await responder(1, RESPOSTAS[0]!)

    const resposta = await responder(3, RESPOSTAS[2]!)

    expect(resposta.status).toBe(409)
    expect(resposta.body.error.code).toBe('passo_fora_de_ordem')
  })

  it('voltar e editar um passo anterior não perde o progresso', async () => {
    await cenario()
    await responderTudo()

    await responder(1, 'Clínica odontológica e de estética facial.')
    const { body } = await estado()

    expect(body.onboarding.currentStep).toBe(5)
    expect(body.onboarding.answers.oferta).toBe('Clínica odontológica e de estética facial.')
  })

  it('resposta com menos de 15 caracteres e passo inexistente são recusados', async () => {
    await cenario()

    expect((await responder(1, 'curto')).status).toBe(400)
    expect((await responder(7, RESPOSTAS[0]!)).status).toBe(400)
  })

  it('concluir sem as quatro respostas é recusado', async () => {
    await cenario()
    await responder(1, RESPOSTAS[0]!)

    const resposta = await request(h.app).post('/onboarding/concluir').set(asUser('chefe-aura'))

    expect(resposta.status).toBe(409)
  })

  it('concluir roda o agente; confirmar grava o Cérebro e mantém as respostas separadas', async () => {
    await cenario()
    await responderTudo()

    const concluir = await request(h.app).post('/onboarding/concluir').set(asUser('chefe-aura'))
    expect(concluir.status).toBe(202)

    const analise = await esperarAnalise()
    expect(analise.onboarding.status).toBe('revisao')
    expect(analise.onboarding.draft.audience).toBe('mulheres de 25 a 45 anos')

    // O chefe editou o público antes de confirmar.
    const confirmar = await request(h.app)
      .post('/onboarding/confirmar')
      .set(asUser('chefe-aura'))
      .send({ ...rascunho, audience: 'mulheres de 25 a 50 anos de Mossoró' })
    expect(confirmar.status).toBe(200)

    const [brain] = await h.db.select().from(brandBrains).where(eq(brandBrains.companyId, auraId))
    expect(brain!.audience).toBe('mulheres de 25 a 50 anos de Mossoró')
    expect(brain!.faq).toEqual(rascunho.faq)

    const [linha] = await h.db
      .select()
      .from(brandOnboardings)
      .where(eq(brandOnboardings.companyId, auraId))
    expect(linha!.status).toBe('concluido')
    expect(linha!.answers.oferta).toBe(RESPOSTAS[0])

    expect((await estado()).body.brainComplete).toBe(true)
  })

  it('sem IA configurada, as respostas ficam salvas e o estado diz o que falta', async () => {
    await cenario(null)
    await responderTudo()

    const resposta = await request(h.app).post('/onboarding/concluir').set(asUser('chefe-aura'))

    expect(resposta.body.status).toBe('sem_ia')
    expect((await estado()).body.onboarding.answers.tom).toBe(RESPOSTAS[3])
  })

  it('IA sem crédito vira sem_ia, e não um erro de "tente de novo"', async () => {
    const semCredito = {
      messages: {
        parse: async () => {
          throw Object.assign(
            new Error('400 Your credit balance is too low to access the Anthropic API.'),
            {
              status: 400,
            },
          )
        },
      },
    } as unknown as ModelClient
    await cenario(semCredito)
    await responderTudo()

    await request(h.app).post('/onboarding/concluir').set(asUser('chefe-aura'))
    const { onboarding } = await esperarAnalise()

    expect(onboarding.status).toBe('sem_ia')
    expect(onboarding.errorMessage).toContain('sem crédito')
  })

  it('a identidade visual guarda as cores e o @, e recusa cor inválida', async () => {
    await cenario()

    const ok = await request(h.app)
      .put('/onboarding/visual')
      .set(asUser('chefe-aura'))
      .send({ colors: ['#1c8cff', '#22C3E6'], instagram: '@firmustech' })
    expect(ok.status).toBe(204)
    expect((await estado()).body.onboarding.visual).toMatchObject({
      colors: ['#1C8CFF', '#22C3E6'],
      instagram: 'firmustech',
    })

    const ruim = await request(h.app)
      .put('/onboarding/visual')
      .set(asUser('chefe-aura'))
      .send({ colors: ['azul'], instagram: '' })
    expect(ruim.status).toBe(400)
  })
})

describe('logo', () => {
  const PNG = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32),
  ])

  const enviar = (corpo: Buffer, tipo: string) =>
    request(h.app)
      .post('/onboarding/logo')
      .set(asUser('chefe-aura'))
      .set('Content-Type', tipo)
      .send(corpo)

  it('aceita PNG e guarda na pasta da empresa', async () => {
    await cenario()

    const resposta = await enviar(PNG, 'image/png')

    expect(resposta.status).toBe(200)
    expect(enviados).toEqual([
      { path: `${auraId}/marca/logo.png`, tipo: 'image/png', tamanho: PNG.length },
    ])
  })

  it('recusa arquivo que diz ser PNG mas não é, e SVG com script', async () => {
    await cenario()

    expect((await enviar(Buffer.from('não sou png'), 'image/png')).status).toBe(400)
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
    )
    expect((await enviar(svg, 'image/svg+xml')).status).toBe(400)
    expect(enviados).toEqual([])
  })

  it('recusa arquivo acima de 5 MB', async () => {
    await cenario()

    const grande = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)])
    const resposta = await enviar(grande, 'image/png')

    expect(resposta.status).toBe(413)
    expect(resposta.body.error.code).toBe('logo_grande_demais')
  })
})

describe('permissão', () => {
  it('o funcionário lê, mas não grava nada', async () => {
    await cenario()

    expect((await estado('func-aura')).status).toBe(200)
    expect((await responder(1, RESPOSTAS[0]!, 'func-aura')).status).toBe(403)
    expect(
      (await request(h.app).post('/onboarding/concluir').set(asUser('func-aura'))).status,
    ).toBe(403)
    expect(
      (
        await request(h.app)
          .put('/onboarding/visual')
          .set(asUser('func-aura'))
          .send({ colors: [], instagram: '' })
      ).status,
    ).toBe(403)
  })

  it('as respostas de uma empresa não aparecem para a outra', async () => {
    await cenario()
    await responder(1, RESPOSTAS[0]!)

    const { body } = await estado('chefe-rival')

    expect(body.onboarding.answers).toEqual({})
  })
})
