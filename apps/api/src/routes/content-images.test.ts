import { contentItems } from '@firmus/db/schema'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import type { AssetUrlSigner } from '../storage/supabase'
import { asUser, createHarness, type Harness } from '../test/harness'

let h: Harness

afterEach(async () => {
  await h.close()
})

/** Gerador falso: guarda o que pediram e devolve um link previsível. */
function assinadorFalso() {
  const pedidos: string[][] = []

  const sign: AssetUrlSigner = async (paths) => {
    pedidos.push(paths)
    return paths.map((p) => (p.includes('sumiu') ? null : `https://storage.test/${p}?token=x`))
  }

  return { sign, pedidos }
}

async function cenario(signAssetUrls: AssetUrlSigner | null) {
  h = await createHarness({ signAssetUrls })

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

  return { auraId: aura.companyId, rivalId: rival.companyId }
}

async function carrossel(companyId: string, imagePaths: (string | undefined)[]) {
  await h.db.insert(contentItems).values({
    companyId,
    type: 'carrossel',
    status: 'aguardando',
    title: 'Quem é a empresa',
    body: { slides: imagePaths.map((imagePath, i) => ({ title: `Slide ${i + 1}`, imagePath })) },
  })
}

const listar = (quem: string) => request(h.app).get('/content').set(asUser(quem))

describe('imagens dos slides', () => {
  it('devolve um link temporário por slide, na ordem', async () => {
    const { sign } = assinadorFalso()
    const { auraId } = await cenario(sign)
    await carrossel(auraId, [
      `${auraId}/conteudo/a/slide-01.png`,
      `${auraId}/conteudo/a/slide-02.png`,
    ])

    const resposta = await listar('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.items[0].images).toEqual([
      `https://storage.test/${auraId}/conteudo/a/slide-01.png?token=x`,
      `https://storage.test/${auraId}/conteudo/a/slide-02.png?token=x`,
    ])
  })

  it('não devolve o body cru, só os links', async () => {
    const { sign } = assinadorFalso()
    const { auraId } = await cenario(sign)
    await carrossel(auraId, [`${auraId}/conteudo/a/slide-01.png`])

    const resposta = await listar('chefe-aura')

    expect(resposta.body.items[0].body).toBeUndefined()
  })

  it('caminho fora da pasta da empresa não vira link', async () => {
    // Um caminho errado gravado no body não pode entregar imagem de outra empresa.
    const { sign, pedidos } = assinadorFalso()
    const { auraId, rivalId } = await cenario(sign)
    await carrossel(auraId, [
      `${rivalId}/conteudo/x/slide-01.png`,
      `${auraId}/conteudo/a/slide-01.png`,
    ])

    const resposta = await listar('chefe-aura')

    expect(resposta.body.items[0].images).toEqual([
      `https://storage.test/${auraId}/conteudo/a/slide-01.png?token=x`,
    ])
    expect(pedidos.flat().some((p) => p.startsWith(rivalId))).toBe(false)
  })

  it('imagem que o Storage não achou some da lista, sem quebrar a peça', async () => {
    const { sign } = assinadorFalso()
    const { auraId } = await cenario(sign)
    await carrossel(auraId, [`${auraId}/conteudo/a/sumiu.png`, `${auraId}/conteudo/a/slide-02.png`])

    const resposta = await listar('chefe-aura')

    expect(resposta.body.items[0].images).toEqual([
      `https://storage.test/${auraId}/conteudo/a/slide-02.png?token=x`,
    ])
  })

  it('peça sem imagem e api sem Storage devolvem lista vazia', async () => {
    const { auraId } = await cenario(null)
    await carrossel(auraId, [`${auraId}/conteudo/a/slide-01.png`])
    await h.db
      .insert(contentItems)
      .values({ companyId: auraId, type: 'post', status: 'rascunho', title: 'Sem body' })

    const resposta = await listar('chefe-aura')

    expect(resposta.status).toBe(200)
    expect(resposta.body.items.map((i: { images: string[] }) => i.images)).toEqual([[], []])
  })

  it('várias peças custam uma chamada só ao Storage', async () => {
    const { sign, pedidos } = assinadorFalso()
    const { auraId } = await cenario(sign)
    await carrossel(auraId, [`${auraId}/conteudo/a/slide-01.png`])
    await carrossel(auraId, [
      `${auraId}/conteudo/b/slide-01.png`,
      `${auraId}/conteudo/b/slide-02.png`,
    ])

    const resposta = await listar('chefe-aura')

    expect(pedidos).toHaveLength(1)
    const contagem = resposta.body.items.map((i: { images: string[] }) => i.images.length).sort()
    expect(contagem).toEqual([1, 2])
  })
})

describe('texto dos slides', () => {
  it('devolve o texto de cada slide junto do link da imagem dele', async () => {
    const { sign } = assinadorFalso()
    const { auraId } = await cenario(sign)
    await h.db.insert(contentItems).values({
      companyId: auraId,
      type: 'carrossel',
      status: 'aguardando',
      title: 'Cinco mitos',
      body: {
        slides: [
          {
            label: 'Capa',
            title: 'Cinco mitos',
            body: 'Arraste',
            imagePath: `${auraId}/a/sumiu.png`,
          },
          { title: 'Mito 1', body: '  ', imagePath: `${auraId}/a/slide-02.png` },
        ],
      },
    })

    const resposta = await listar('chefe-aura')

    // A imagem do primeiro sumiu, mas o texto dele continua no lugar certo.
    expect(resposta.body.items[0].slides).toEqual([
      { label: 'Capa', title: 'Cinco mitos', body: 'Arraste', imageUrl: null },
      {
        label: null,
        title: 'Mito 1',
        body: null,
        imageUrl: `https://storage.test/${auraId}/a/slide-02.png?token=x`,
      },
    ])
  })

  it('peça sem slides devolve lista vazia', async () => {
    const { auraId } = await cenario(null)
    await h.db
      .insert(contentItems)
      .values({ companyId: auraId, type: 'post', status: 'rascunho', title: 'Sem body' })

    const resposta = await listar('chefe-aura')

    expect(resposta.body.items[0].slides).toEqual([])
  })
})
