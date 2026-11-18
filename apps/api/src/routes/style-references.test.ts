import type { ModelClient } from '@firmus/agents/runtime'
import { brandStyleReferences } from '@firmus/db/schema'
import type { StyleGuide } from '@firmus/shared'
import { eq } from 'drizzle-orm'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import type { AssetRemover, AssetUploader, AssetUrlSigner } from '../storage/supabase'
import { asUser, createHarness, type Harness } from '../test/harness'
import { MAX_REFERENCIAS } from './style-references'

let h: Harness
let auraId: string
let rivalId: string
let enviados: { path: string; tipo: string }[]
let apagados: string[]
let chamadasIa: number

/** O começo de um PNG de verdade, e um corpo qualquer depois. */
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
])
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)])

const guia: StyleGuide = {
  summary: 'Fundo escuro com um destaque laranja.',
  palette: [{ hex: '#FF6A00', role: 'destaque' }],
  typography: 'Sem serifa, caixa alta.',
  composition: 'Título grande no topo.',
  textDensity: 'Uma frase curta.',
  imagery: 'Sem foto.',
  mood: 'sóbrio',
  dos: ['uma cor de destaque só'],
  donts: ['texto demais'],
}

function iaFalsa(falhar = false): ModelClient {
  return {
    messages: {
      parse: async () => {
        chamadasIa += 1
        if (falhar) throw new Error('a IA caiu')
        return {
          parsed_output: guia,
          stop_reason: 'end_turn',
          stop_details: null,
          usage: { input_tokens: 100, output_tokens: 100 },
        }
      },
    },
  } as unknown as ModelClient
}

async function cenario(opcoes: { ia?: ModelClient | null; storage?: boolean } = {}) {
  enviados = []
  apagados = []
  chamadasIa = 0

  const uploadAsset: AssetUploader = async (path, _body, tipo) => {
    enviados.push({ path, tipo })
  }
  const signAssetUrls: AssetUrlSigner = async (paths) => paths.map((p) => `https://cdn/${p}`)
  const removeAssets: AssetRemover = async (paths) => {
    apagados.push(...paths)
  }

  h = await createHarness({
    aiClient: opcoes.ia === undefined ? iaFalsa() : opcoes.ia,
    ...(opcoes.storage === false ? {} : { uploadAsset, signAssetUrls, removeAssets }),
  })

  auraId = (
    await h.createCompanyWithBoss({
      companyName: 'Studio Aura',
      userId: 'chefe-aura',
      email: 'chefe@aura.com',
      fullName: 'Chefe da Aura',
    })
  ).companyId

  await h.addMember({
    companyId: auraId,
    userId: 'func-aura',
    email: 'func@aura.com',
    fullName: 'Funcionária da Aura',
    role: 'funcionario',
  })

  rivalId = (
    await h.createCompanyWithBoss({
      companyName: 'Clínica Rival',
      userId: 'chefe-rival',
      email: 'chefe@rival.com',
      fullName: 'Chefe da Rival',
    })
  ).companyId
}

afterEach(async () => {
  await h.close()
})

const enviar = (quem: string, corpo: Buffer = PNG, tipo = 'image/png') =>
  request(h.app)
    .post('/brand/style-references')
    .set(asUser(quem))
    .set('Content-Type', tipo)
    .send(corpo)

const referenciasDe = (companyId: string) =>
  h.db.select().from(brandStyleReferences).where(eq(brandStyleReferences.companyId, companyId))

describe('enviar uma referência', () => {
  it('a IA lê, a imagem vai para o Storage e o guia fica guardado', async () => {
    await cenario()

    const r = await enviar('chefe-aura')

    expect(r.status).toBe(201)
    expect(r.body.reference.guide.mood).toBe('sóbrio')
    expect(r.body.reference.imageUrl).toMatch(/^https:\/\/cdn\//)
    expect(enviados).toHaveLength(1)
    expect(enviados[0]!.path).toMatch(new RegExp(`^${auraId}/referencias/[0-9a-f-]+\\.png$`))

    const [linha] = await referenciasDe(auraId)
    expect(linha!.imagePath).toBe(enviados[0]!.path)
  })

  it('aceita JPG também', async () => {
    await cenario()

    const r = await enviar('chefe-aura', JPG, 'image/jpeg')

    expect(r.status).toBe(201)
    expect(enviados[0]!.path).toMatch(/\.jpg$/)
  })

  it('arquivo que finge ser imagem é recusado antes de chamar a IA', async () => {
    await cenario()

    const r = await enviar('chefe-aura', Buffer.from('<script>alert(1)</script>'), 'image/png')

    expect(r.status).toBe(400)
    expect(r.body.error.code).toBe('referencia_tipo_invalido')
    expect(chamadasIa).toBe(0)
  })

  it('se a IA falhar, nada fica salvo: nem imagem, nem linha', async () => {
    await cenario({ ia: iaFalsa(true) })

    const r = await enviar('chefe-aura')

    expect(r.status).toBe(500)
    expect(enviados).toHaveLength(0)
    expect(await referenciasDe(auraId)).toHaveLength(0)
  })

  it(`para em ${MAX_REFERENCIAS} referências`, async () => {
    await cenario()
    for (let i = 0; i < MAX_REFERENCIAS; i++) {
      expect((await enviar('chefe-aura')).status).toBe(201)
    }

    const r = await enviar('chefe-aura')

    expect(r.status).toBe(409)
    expect(r.body.error.code).toBe('limite_de_referencias')
    expect(await referenciasDe(auraId)).toHaveLength(MAX_REFERENCIAS)
  })

  it('sem IA configurada, 503 explicando o que falta', async () => {
    await cenario({ ia: null })

    const r = await enviar('chefe-aura')

    expect(r.status).toBe(503)
    expect(r.body.error.code).toBe('ia_nao_configurada')
  })

  it('sem Storage configurado, 503 explicando o que falta', async () => {
    await cenario({ storage: false })

    const r = await enviar('chefe-aura')

    expect(r.status).toBe(503)
    expect(r.body.error.code).toBe('storage_nao_configurado')
  })
})

describe('quem pode', () => {
  it('o funcionário não envia', async () => {
    await cenario()

    expect((await enviar('func-aura')).status).toBe(403)
    expect(chamadasIa).toBe(0)
  })

  it('mas vê as referências da empresa', async () => {
    await cenario()
    await enviar('chefe-aura')

    const r = await request(h.app).get('/brand/style-references').set(asUser('func-aura'))

    expect(r.status).toBe(200)
    expect(r.body.references).toHaveLength(1)
    expect(r.body.max).toBe(MAX_REFERENCIAS)
  })

  it('o funcionário não apaga', async () => {
    await cenario()
    const { body } = await enviar('chefe-aura')

    const r = await request(h.app)
      .delete(`/brand/style-references/${body.reference.id}`)
      .set(asUser('func-aura'))

    expect(r.status).toBe(403)
    expect(await referenciasDe(auraId)).toHaveLength(1)
  })
})

describe('apagar', () => {
  it('tira a linha e o arquivo do Storage', async () => {
    await cenario()
    const { body } = await enviar('chefe-aura')

    const r = await request(h.app)
      .delete(`/brand/style-references/${body.reference.id}`)
      .set(asUser('chefe-aura'))

    expect(r.status).toBe(204)
    expect(await referenciasDe(auraId)).toHaveLength(0)
    expect(apagados).toEqual([enviados[0]!.path])
  })

  it('id que não é uuid é só "não existe"', async () => {
    await cenario()

    const r = await request(h.app)
      .delete('/brand/style-references/nao-e-uuid')
      .set(asUser('chefe-aura'))

    expect(r.status).toBe(404)
  })
})

describe('isolamento entre empresas', () => {
  it('a rival não vê as referências da Aura', async () => {
    await cenario()
    await enviar('chefe-aura')

    const r = await request(h.app).get('/brand/style-references').set(asUser('chefe-rival'))

    expect(r.body.references).toEqual([])
  })

  it('a rival não apaga a referência da Aura, nem sabendo o id', async () => {
    await cenario()
    const { body } = await enviar('chefe-aura')

    const r = await request(h.app)
      .delete(`/brand/style-references/${body.reference.id}`)
      .set(asUser('chefe-rival'))

    expect(r.status).toBe(404)
    expect(await referenciasDe(auraId)).toHaveLength(1)
    expect(apagados).toEqual([])
  })

  it('o limite conta por empresa', async () => {
    await cenario()
    for (let i = 0; i < MAX_REFERENCIAS; i++) await enviar('chefe-aura')

    expect((await enviar('chefe-rival')).status).toBe(201)
    expect(await referenciasDe(rivalId)).toHaveLength(1)
  })
})
